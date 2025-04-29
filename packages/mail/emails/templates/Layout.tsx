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

type LayoutPropsProps<T> = {
  app: string;
  stage: string;
  app_url: string;
  organization_slug: string;
  organization: string;
  assetsUrl: string;
  preview: string;
  children: React.ReactNode;
  script?: React.ReactNode;
  action_right?: React.ReactNode;
} & T;

export const Layout = <T,>(props: LayoutPropsProps<T>) => {
  return (
    <Html lang="en">
      <Head></Head>
      <Fonts assetsUrl={props.assetsUrl} />
      <Preview>{props.preview}</Preview>
      <Body style={body} id={Math.random().toString()}>
        {props.script && props.script}
        <Container style={container}>
          <Img
            height="40"
            alt="WareHouse Logo"
            src={`${props.assetsUrl}/northstar-wheels.svg`}
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
                  href={props.app_url}
                  style={{
                    fontWeight: 700,
                  }}
                >
                  northstar
                </Link>
              </Column>
              <Column align="right">{props.action_right && props.action_right}</Column>
            </Row>
            {props.children}
            <Row
              style={{
                padding: `${unit}px`,
                borderTop: `1px solid ${SURFACE_COLOR}`,
              }}
            >
              <Column>
                <Link href={props.app_url} style={footerLink}>
                  <Img height="16" alt="WareHouse Logo" src={`${props.assetsUrl}/northstar-wheels.svg`} />
                </Link>
              </Column>
              <Column align="right">
                <Link
                  style={props.footerLink}
                  href={`${props.app_url}/organization/${props.organization_slug}/manage#alerts`}
                >
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

export default Layout;
