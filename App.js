import { ExpoRoot } from "expo-router";
import Head from "expo-router/head";
const context = require.context("./src/app", true);

export default function App() {
  return (
    <Head.Provider>
      <ExpoRoot context={context} location="/" />
    </Head.Provider>
  );
}
