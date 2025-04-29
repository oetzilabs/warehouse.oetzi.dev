import { Footer } from "@/components/Footer";
import { RouteDefinition } from "@solidjs/router";

export const route = {
  preload: async (props) => {},
} satisfies RouteDefinition;

export default function IndexPage() {
  return (
    <>
      <Footer />
    </>
  );
}
