import ora from "ora";
import Chalk from "chalk";

export default async function deployService() {
    ora(Chalk.yellowBright.bold('部署中,请稍后...\n')).start()
}