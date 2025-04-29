export const Layers = {
  imageMagick: "arn:aws:serverlessrepo:us-east-1:145266761615:applications/image-magick-lambda-layer",
  sharp: "arn:aws:serverlessrepo:us-east-1:987481058235:applications/nodejs-sharp-lambda-layer",
  graphicsmagick: "arn:aws:lambda:eu-central-1:175033217214:layer:graphicsmagick:2",
  ghostscript: "arn:aws:lambda:eu-west-3:764866452798:layer:ghostscript:16",
  chrome: "arn:aws:serverlessrepo:us-east-1:347971939225:applications/serverless-chrome-layer",
  canvas: "arn:aws:serverlessrepo:us-east-1:990551184979:applications/lambda-layer-canvas-nodejs",
} as const;
