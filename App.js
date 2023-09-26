import * as React from "react";
import { AppRegistry } from "react-native";
import { Navigation } from "./src/routes";
import { name as appName } from "./app.json";

AppRegistry.registerComponent(appName, () => Navigation)