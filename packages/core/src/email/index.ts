import { SendEmailCommand, SESv2Client } from "@aws-sdk/client-sesv2";
import { Resource } from "sst";

export module Email {
  const ses = new SESv2Client({});

  export async function send(from: string, to: string, subject: string, html: string, text: string) {
    from = from + "@" + Resource.MainEmail.sender;
    console.log("sending email", subject, from, to);
    await ses.send(
      new SendEmailCommand({
        Destination: {
          ToAddresses: [to],
        },
        Content: {
          Simple: {
            Body: {
              Html: {
                Data: html,
              },
              Text: {
                Data: text,
              },
            },
            Subject: {
              Data: subject,
            },
          },
        },
        FromEmailAddress: `WareHouse <${from}>`,
      }),
    );
  }
}
