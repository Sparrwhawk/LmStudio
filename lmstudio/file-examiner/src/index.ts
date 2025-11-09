import { type PluginContext } from "@lmstudio/sdk";
import { fileExaminerTools } from "./fileExaminerTools";
import { configSchematics } from "./config";

export async function main(context: PluginContext) {
  // Register the configuration schematics
  context.withConfigSchematics(configSchematics);
  
  // Register the file examiner tools provider
  context.withToolsProvider(fileExaminerTools);
}