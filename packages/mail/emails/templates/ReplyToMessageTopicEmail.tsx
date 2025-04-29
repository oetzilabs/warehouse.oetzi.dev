// @ts-nocheck
import { Body, Button, Column, Container, Head, Html, Img, Link, Preview, Row, Section } from "@jsx-email/all";
import * as React from "react";
// import { resolve } from "node:path";
import { Fonts, Text } from "../components";
import { body, buttonPrimary, container, footerLink, frame, SURFACE_COLOR, unit } from "../styles";

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

interface ReplyToMessageTopicEmailProps {
  app: string;
  stage: string;
  app_url: string;
  organization_slug: string;
  organization: string;
  assetsUrl: string;
  message_topic_slug: string;
  messages: string[];
  sender: string;
}
export const ReplyToMessageTopicEmail = ({
  app = "northstar-app",
  stage = "production",
  app_url = "http://localhost:3000",
  organization_slug = "testcompany-iPdQFt",
  organization = "TestCompany",
  message_topic_slug = "123412341234",
  assetsUrl = LOCAL_ASSETS_URL,
  messages = ["Yo this is a reply to a message from John Doe"],
  sender = "john.doe@northstar.com",
}: ReplyToMessageTopicEmailProps) => {
  const url = `${app_url}/organization/${organization_slug}/messages/${message_topic_slug}`;
  const finalMessage =
    messages.join(" ").length > 280 ? messages.join(" ").substring(0, 280) + "..." : messages.join(" ");
  return (
    <Html lang="en">
      <Head></Head>
      <Fonts assetsUrl={assetsUrl} />
      <Preview>{finalMessage}</Preview>
      <Body style={body} id={Math.random().toString()}>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "http://schema.org",
            "@type": "EmailMessage",
            potentialAction: {
              "@type": "ViewAction",
              url: url,
              name: "Customer Message to Company",
            },
            description: `${sender} sent you a message on ${organization}`,
          })}
        </script>
        <Container style={container}>
          <Img
            height="40"
            alt="WareHouse Logo"
            src={`${assetsUrl}/northstar-wheels.svg`}
            style={{
              opacity: 0.1,
              margin: "0 auto",
              paddingTop: 30,
              paddingBottom: 30,
            }}
          />
          <Section style={frame}>
            <Row
              style={{
                padding: `${unit}px`,
                borderBottom: `1px solid ${SURFACE_COLOR}`,
              }}
            >
              <Column>
                <Link
                  href={app_url}
                  style={{
                    fontWeight: 700,
                  }}
                >
                  northstar
                </Link>
              </Column>
              <Column align="right">
                <Button style={buttonPrimary} href={url}>
                  View Message
                </Button>
              </Column>
            </Row>
            <Section
              style={{
                paddingLeft: `${unit}px`,
                paddingRight: `${unit}px`,
              }}
            >
              <Text style={{ fontSize: "16px", fontWeight: 600 }}>{sender} replied to your message!</Text>
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
            <Row
              style={{
                padding: `${unit}px`,
                borderTop: `1px solid ${SURFACE_COLOR}`,
              }}
            >
              <Column>
                <Link href={app_url} style={footerLink}>
                  <Img height="16" alt="WareHouse Logo" src={`${assetsUrl}/northstar-wheels.svg`} />
                </Link>
              </Column>
              <Column align="right">
                <Link style={footerLink} href={`${app_url}/organization/${organization_slug}/manage#alerts`}>
                  Manage Alerts
                </Link>
              </Column>
            </Row>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default ReplyToMessageTopicEmail;
