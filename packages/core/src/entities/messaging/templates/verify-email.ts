export default async function create(data: { name: string; email: string }) {
  return {
    to: data.email,
    subject: "Warehouse verification",
    text: `Hello ${data.name},

Please click the link below to verify your email address.

https://warehouse.oetzi.dev/verify/${data.email}

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
    <p>You recently requested to join Warehouse. Please click the link below to verify your email address.</p>
    <p><a href="https://warehouse.oetzi.dev/verify/${data.email}">Verify email</a></p>
    <p>If you did not request to join Warehouse, please ignore this email.</p>
  </body>
</html>`,
  };
}
