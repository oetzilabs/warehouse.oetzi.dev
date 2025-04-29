export type Block = {
  Id: string;
  Page: number;
  Geometry: {
    Polygon: Array<{
      X: number;
      Y: number;
    }>;
    BoundingBox: {
      Top: number;
      Left: number;
      Width: number;
      Height: number;
    };
  };
  BlockType: string;
  Relationships?: Array<{
    Ids: Array<string>;
    Type: string;
  }>;
  Text?: string;
  Confidence?: number;
  TextType?: string;
  EntityTypes?: Array<string>;
  RowSpan?: number;
  RowIndex?: number;
  ColumnSpan?: number;
  ColumnIndex?: number;
};

interface TreeNode {
  block: Block;
  children: TreeNode[];
}

export function convert(blocks: Block[]): TreeNode[] {
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

export function generateSVG(tree: TreeNode[]) {
  let svgContent = `<svg width="10000" height="10000" xmlns="http://www.w3.org/2000/svg">`;

  const drawNode = (node: TreeNode, x: number, y: number) => {
    svgContent += `<rect x="${x}" y="${y}" width="100" height="50" fill="lightgray" stroke="black" />`;
    svgContent += `<text x="${x + 10}" y="${y + 30}" font-family="Arial" font-size="14">${(
      node.block.Text ?? ""
    ).replace("&", "&amp;")}</text>`;

    const children = node.children;
    if (children.length > 0) {
      const childY = y + 100;
      const childWidth = 100 * children.length;
      const startX = x + (100 - childWidth) / 2;

      children.forEach((child, index) => {
        const childX = startX + index * 100;
        svgContent += `<line x1="${x + 50}" y1="${y + 50}" x2="${childX + 50}" y2="${childY}" stroke="black" />`;
        drawNode(child, childX, childY);
      });
    }
  };

  for (let i = 0; i < tree.length; i++) {
    drawNode(tree[i], i * 300 + 100, 50);
  }

  svgContent += `</svg>`;

  return svgContent;
}
