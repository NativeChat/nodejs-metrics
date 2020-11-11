// https://stackoverflow.com/questions/29011457/jasmine-jasmine-reporters-on-nodejs-missing-output

import Jasmine from "jasmine";
import { existsSync, mkdirSync } from "fs";

// tslint:disable-next-line: no-var-requires
const { JUnitXmlReporter, TerminalReporter } = require("jasmine-reporters");

const addReporters = (jasmineEnv: Jasmine) => {
    const reportsPath = `${__dirname}/../reports`;
    if (!existsSync(reportsPath)) {
        mkdirSync(reportsPath);
    }

    const junitReporter = new JUnitXmlReporter({
        savePath: reportsPath,
        consolidateAll: false,
    });

    jasmineEnv.addReporter(junitReporter);

    const terminalReporter = new TerminalReporter({
        color: true,
        verbosity: 3,
    });

    jasmineEnv.addReporter(terminalReporter);
};

export const runner = (jasmineConfigFile: string, configure?: ((jasmine: Jasmine) => void)) => {
    const jasmineEnv = new Jasmine({});
    jasmineEnv.loadConfigFile(jasmineConfigFile);
    addReporters(jasmineEnv);

    if (configure && typeof configure === "function") {
        configure(jasmineEnv);
    }

    jasmineEnv.execute();
};
