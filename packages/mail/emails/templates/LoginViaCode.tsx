// @ts-nocheck
import { Body, Button, Column, Container, Head, Html, Img, Link, Preview, Row, Section } from "@jsx-email/all";
import * as React from "react";
// import { resolve } from "node:path";
import { Fonts, Text } from "../components";
import { SURFACE_COLOR, body, buttonPrimary, container, footerLink, frame, unit } from "../styles";
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

type LoginViaEmailProps<T> = {
  app: string;
  stage: string;
  app_url: string;
  assetsUrl: string;
} & T;

/*

*/

export const LoginViaEmail = ({
  app = "northstar-app",
  stage = "production",
  app_url = "http://localhost:3001",
  assetsUrl = LOCAL_ASSETS_URL,
  code = "123456789",
}: LoginViaEmailProps<{
  code: string;
}>) => {
  return (
    <Layout<{
      code: string;
    }>
      app={app}
      stage={stage}
      app_url={app_url}
      assetsUrl={assetsUrl}
      code={code}
      // script={
      //   <script type="application/ld+json">
      //     {JSON.stringify({
      //       "@context": "http://schema.org",
      //       "@type": "EmailMessage",
      //       potentialAction: {
      //         "@type": "ViewAction",
      //         url: url,
      //         name: "Customer Message to Company",
      //       },
      //       description: "Message from potential customer to company",
      //     })}
      //   </script>
      // }
    >
      <Section
        style={{
          padding: `${unit}px`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <Text style={{ fontSize: "16px", fontWeight: 600 }}>Here is your code to sign in!</Text>
        <Text style={{ fontSize: "16px", fontWeight: 600, fontFamily: "monospace" }}>{code}</Text>
        <Button style={buttonPrimary} href={`${app_url}/auth/email?code=${code}`}>
          Sign in
        </Button>
      </Section>
    </Layout>
  );
};

export default LoginViaEmail;
