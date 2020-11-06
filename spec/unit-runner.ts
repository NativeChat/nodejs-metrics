"use strict";

import { join } from "path";
import { runner } from "./runner";

runner(join(__dirname, "support", "unit.json"));
