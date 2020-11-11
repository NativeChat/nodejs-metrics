import { join } from "path";
import { runner } from "./runner";

runner(join(__dirname, "support", "integration.json"));
