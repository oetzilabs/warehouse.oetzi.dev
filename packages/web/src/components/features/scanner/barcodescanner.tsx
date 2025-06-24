import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QueryClient, useMutation } from "@tanstack/solid-query";
import { Html5Qrcode } from "html5-qrcode";
import { createEffect, createSignal, onCleanup, onMount } from "solid-js";
import { toast } from "solid-sonner";

export default function BarcodeScanner(props: { onScan: (data: string) => void }) {
  const [open, setOpen] = createSignal(false);
  let feedRef: HTMLDivElement | undefined;
  let scanner: Html5Qrcode | undefined;
  const [queryClient] = createSignal<QueryClient>(new QueryClient());

  // Mutation for scanning
  const scanMutation = useMutation(
    () => ({
      mutationKey: ["scan"],
      mutationFn: async () => {
        if (!feedRef) throw new Error("No feed ref");
        scanner = new Html5Qrcode(feedRef.id);
        await scanner.start(
          { facingMode: "environment" },
          { fps: 60 },
          (decodedText) => {
            props.onScan(decodedText);
            stopScan();
          },
          (error) => {
            console.error(error);
          },
        );
      },
    }),
    queryClient,
  );

  function stopScan() {
    if (scanner) {
      scanner.stop().then(() => {
        scanner?.clear();
        scanner = undefined;
      });
    } else {
      toast.error("No scanner found");
    }
    setOpen(false);
    scanMutation.reset();
  }

  onCleanup(() => {
    stopScan();
  });

  createEffect(() => {
    const isOpen = open();
    if (isOpen) {
      scanMutation.mutate();
    }
  });

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Scan
      </Button>
      <Dialog open={open()} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader class="w-full text-left">
            <DialogTitle>Scan Barcode</DialogTitle>
          </DialogHeader>
          <div
            ref={feedRef!}
            id="barcode-scanner-feed"
            class="feed rounded-lg overflow-clip bg-black text-white aspect-square w-full"
          />
          <DialogFooter>
            {/* <Button type="button" onClick={() => scanMutation.mutate()} disabled={scanMutation.isPending}>
              Scan
            </Button> */}
            <Button type="button" onClick={stopScan} disabled={scanMutation.isPending}>
              Stop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
