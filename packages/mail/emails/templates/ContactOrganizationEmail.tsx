// @ts-nocheck
import { Column, Row, Section } from "@jsx-email/all";
import * as React from "react";
// import { resolve } from "node:path";
import { Text } from "../components";
import { SURFACE_COLOR, unit } from "../styles";
import { Layout } from "./Layout";
// const LOCAL_ASSETS_URL = resolve("./static/");
const LOCAL_ASSETS_URL = "http://localhost:3000/assets/email";

const messageContainer = {
  padding: `${unit * 1}px ${unit}px`,
  borderRadius: `${unit * 0.5}px`,
};

const messageFrame = {
  fontFamily: "Manrope",
  fontWeight: 500,
  fontSize: "14px",
  lineHeight: "1",
  padding: `0px 0px`,
  margin: `0px 0px`,
  // backgroundColor: DIMMED_COLOR,
};

interface ContactOrganizationEmailProps {
  app: string;
  stage: string;
  app_url: string;
  organization_slug: string;
  organization: string;
  assetsUrl: string;
  message_slug: string;
  messages: string[];
  sender: string;
}

/*

*/

export const ContactOrganizationEmail = ({
  app = "northstar-app",
  stage = "production",
  app_url = "http://localhost:3000",
  organization_slug = "testcompany-iPdQFt",
  assetsUrl = LOCAL_ASSETS_URL,
  organization = "TestCompany",
  message_slug = "message-309458",
  messages = [
    "Hello, I would like to get in touch with you.",
    "We have a great product that we want to transit across the world.",
    "We heard that you are the right company to do this.",
    "Can you please let us know more about your services and what you can offer us? We would love to hear from you and see how we can work together to make this happen.",
    "Thank you for your time and consideration.",
    "Best regards,",
    "TestCompany",
  ],
  sender = "john.doe@northstar.com",
}: ContactOrganizationEmailProps) => {
  const url = `${app_url}/organization/${organization_slug}/messages/${message_slug}`;
  const finalMessage =
    messages.join(" ").length > 280 ? messages.join(" ").substring(0, 280) + "..." : messages.join(" ");
  return (
    <Layout<{}>
      app={app}
      stage={stage}
      app_url={app_url}
      organization_slug={organization_slug}
      organization={organization}
      assetsUrl={assetsUrl}
      message_slug={message_slug}
      messages={messages}
      sender={sender}
      preview={finalMessage}
      script={
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "http://schema.org",
            "@type": "EmailMessage",
            potentialAction: {
              "@type": "ViewAction",
              url: url,
              name: "Customer Message to Company",
            },
            description: "Message from potential customer to company",
          })}
        </script>
      }
    >
      <Section
        style={{
          paddingLeft: `${unit}px`,
          paddingRight: `${unit}px`,
        }}
      >
        <Text style={{ fontSize: "16px", fontWeight: 600 }}>You got a new message from {sender}!</Text>
      </Section>
      <Section style={{ ...messageContainer }}>
        <Row>
          <Column
            style={{
              display: "flex",
              flexDirection: "column",
              background: SURFACE_COLOR,
              padding: `${unit}px`,
              borderRadius: `${unit * 0.5}px`,
              gap: `${unit}px`,
            }}
          >
            {messages.map((m, i) => (
              <Text key={i} style={messageFrame}>
                {m}
              </Text>
            ))}
          </Column>
        </Row>
      </Section>
    </Layout>
  );
};

export default ContactOrganizationEmail;
