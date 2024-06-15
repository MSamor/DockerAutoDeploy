import Inquirer from "inquirer";
import {getPrivateByName, getPrivateName, getPublicByName, getPublicName} from "../../../utils/jsonUtils.js";

export default async function deployConfig(configJson) {
    // 填写容器镜像名称
    let imageName = ''
    let imageUrl = ''

    let fullImageUrl = ''
    let auth = {}

    // 执行部署命令
    const promptList = [
        {
            type: 'list',
            message: '请选择镜像仓库来源',
            name: 'source',
            choices: [
                "public",
                "private",
            ],
        },
    ];
    const answers = await Inquirer.prompt(promptList)

    if (answers.source === 'public') {
        // 从公共仓库拉取镜像
        const imageList = [{
            type: 'list',
            message: '请选择镜像',
            name: 'image',
            choices: getPublicName(configJson),
        }]
        const answers = await Inquirer.prompt(imageList)
        const image = getPublicByName(configJson, answers.image)
        imageName = image.name;
        imageUrl = image.serveraddress + '/' + image.imageName;
    } else if (answers.source === 'private') {
        // 从私有仓库拉取镜像
        const imageList = [{
            type: 'list',
            message: '请选择镜像',
            name: 'image',
            choices: getPrivateName(configJson),
        }]
        const answers = await Inquirer.prompt(imageList)
        const image = getPrivateByName(configJson, answers.image)

        auth = image;
        imageName = image.imageName;
        imageUrl = image.serveraddress + '/' + image.imageName;
    }

    // 获取版本号
    const promptVersion = [
        {
            type: 'input',
            message: '请输入版本tag',
            name: 'tag',
            default: "latest",
        },
    ];
    const version = await Inquirer.prompt(promptVersion)

    fullImageUrl = imageUrl + ':' + version.tag

    return {
        imageName,
        fullImageUrl,
        auth
    }

}