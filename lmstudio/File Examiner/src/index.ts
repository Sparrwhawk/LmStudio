import { type PluginContext } from "@lmstudio/sdk";
import { fileExaminerTools } from "./fileExaminerTools";

export async function main(context: PluginContext) {
  // Register the file examiner tools provider
  context.withToolsProvider(fileExaminerTools);
}