// @ts-nocheck
import { Body, Button, Column, Container, Head, Html, Img, Link, Preview, Row, Section } from "@jsx-email/all";
import React from "react";
import { Fonts, Hr, SplitString, Text } from "../components";
import {
  body,
  breadcrumb,
  breadcrumbColonSeparator,
  buttonPrimary,
  compactText,
  container,
  footerLink,
  frame,
  heading,
  headingHr,
  unit,
} from "../styles";

// const LOCAL_ASSETS_URL = import.meta.resolve("./static/");
const LOCAL_ASSETS_URL = "http://localhost:3000/assets/email";

interface InviteEmailProps {
  workspace: string;
  assetsUrl: string;
  consoleUrl: string;
}
export const InviteEmail = ({
  workspace = "seed",
  assetsUrl = LOCAL_ASSETS_URL,
  consoleUrl = "https://console.sst.dev",
}: InviteEmailProps) => {
  const subject = `Join the ${workspace} workspace`;
  const messagePlain = `You've been invited to join the ${workspace} workspace in the SST Console.`;
  const url = `${consoleUrl}/${workspace}`;
  return (
    <Html lang="en">
      <Head>
        <title>{`WareHouse Portal — ${messagePlain}`}</title>
      </Head>
      <Fonts assetsUrl={assetsUrl} />
      <Preview>{messagePlain}</Preview>
      <Body style={body} id={Math.random().toString()}>
        <Container style={container}>
          <Section style={frame}>
            <Row>
              <Column>
                <a href={consoleUrl}>
                  <Img height="32" alt="WareHouse Logo" src={`${assetsUrl}/northstar-logo.png`} />
                </a>
              </Column>
              <Column align="right">
                <Button style={buttonPrimary} href={url}>
                  <span>Join Company</span>
                </Button>
              </Column>
            </Row>

            <Row style={headingHr}>
              <Column>
                <Hr />
              </Column>
            </Row>

            <Section>
              <Text style={{ ...compactText, ...breadcrumb }}>
                <span>SST</span>
                <span style={{ ...breadcrumbColonSeparator }}>:</span>
                <span>{workspace}</span>
              </Text>
              <Text style={{ ...heading, ...compactText }}>
                <Link href={url}>
                  <SplitString text={subject} split={40} />
                </Link>
              </Text>
            </Section>
            <Section style={{ padding: `${unit}px 0 0 0` }}>
              <Text style={{ ...compactText }}>
                You've been invited to join the <Link href={url}>{workspace}</Link> company in the{" "}
                <Link href={consoleUrl}>WareHouse Portal</Link>.
              </Text>
            </Section>

            <Row style={headingHr}>
              <Column>
                <Hr />
              </Column>
            </Row>

            <Row>
              <Column>
                <Link href={consoleUrl} style={footerLink}>
                  WareHouse Portal
                </Link>
              </Column>
              <Column align="right">
                <Link style={footerLink} href="https://northstar.com">
                  About
                </Link>
              </Column>
            </Row>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default InviteEmail;
