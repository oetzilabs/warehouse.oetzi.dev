export default async function create(data: { name: string; email: string }) {
  return {
    to: data.email,
    subject: "Warehouse verification",
    text: `Hello ${data.name},

Your password has been reset.

If you did not request this email, please ignore it.

Warehouse Team
`,
    html: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Warehouse Verification</title>
  </head>
  <body>
    <h1>Warehouse Verification</h1>
    <p>Hello ${data.name},</p>
    <p>Your password has been reset.</p>
    <p>If you did not request to join Warehouse, please ignore this email.</p>
    <p>Warehouse Team</p>
  </body>
</html>`,
  };
}
