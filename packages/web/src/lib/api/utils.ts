import type { Block, TreeNode } from "@warehouseoetzidev/core/src/drizzle/sql/schema";
import { getCookie, getEvent } from "vinxi/http";
import { lucia } from "../auth";

export const withSession = async () => {
  "use server";
  const event = getEvent()!;

  const sessionId = getCookie(event, lucia.sessionCookieName) ?? null;

  if (!sessionId) {
    return [null, event] as const;
  }

  const session = await lucia.validateSession(sessionId);

  if (!session) {
    return [null, event] as const;
  }
  if (!session.session) {
    return [null, event] as const;
  }

  if (!session.user) {
    return [null, event] as const;
  }
  if (!event.context.user) {
    return [null, event] as const;
  }

  return [session, event] as const;
};

export function convertToTree(blocks: Block[]): TreeNode[] {
  const map: { [id: string]: TreeNode } = {};
  const rootNodes: TreeNode[] = [];

  // Create nodes
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    map[block.Id] = { block, children: [] };
  }

  // Connect parent-child relationships
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (block.Relationships) {
      for (let j = 0; j < block.Relationships.length; j++) {
        const relationship: {
          Ids: Array<string>;
          Type: string;
        } = block.Relationships[j];
        for (let k = 0; k < relationship.Ids.length; k++) {
          const childId = relationship.Ids[k];
          if (map[childId]) {
            map[block.Id].children.push(map[childId]);
          }
        }
      }
    }
  }

  // Find root nodes (nodes with no parents)
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (!block.Relationships || !block.Relationships.find((relationship) => relationship.Type === "PARENT")) {
      rootNodes.push(map[block.Id]);
    }
  }

  return rootNodes;
}
