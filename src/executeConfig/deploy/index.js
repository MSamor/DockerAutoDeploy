import Inquirer from "inquirer";
import {getPrivateByName, getPrivateName, getPublicByName, getPublicName} from "../../../utils/jsonUtils.js";
import Chalk from 'chalk';

export default async function deployConfig(configJson) {
    // 检查是否配置了任何镜像
    const hasPublicImages = configJson.public && Array.isArray(configJson.public) && configJson.public.length > 0;
    const hasPrivateImages = configJson.private && Array.isArray(configJson.private) && configJson.private.length > 0;

    if (!hasPublicImages && !hasPrivateImages) {
        console.log(Chalk.yellow('警告：未配置任何镜像。请在配置文件中添加至少一个公共或私有镜像配置。'));
        console.log(Chalk.blue('提示：可以参考 src/meta/fullConfig.js 中的示例配置。'));
        return;
    }

    // 填写容器镜像名称
    let imageName = ''
    let imageUrl = ''
    let hostPort = ''
    let containerPort = ''
    let selectedImage = null  

    let fullImageUrl = ''
    let auth = {}

    // 执行部署命令
    const choices = [];
    if (hasPublicImages) choices.push("public");
    if (hasPrivateImages) choices.push("private");

    const promptList = [
        {
            type: 'list',
            message: '请选择镜像仓库来源',
            name: 'source',
            choices,
        },
    ];
    const answers = await Inquirer.prompt(promptList)

    if (answers.source === 'public') {
        // 从公共仓库拉取镜像
        const choices = configJson.public.map(imageItem => ({
            name: `${imageItem.name} (${imageItem.imageName} @ ${imageItem.serveraddress})`,
            value: imageItem.name
        }));
        
        const imageList = [{
            type: 'list',
            message: '请选择镜像',
            name: 'image',
            choices,
        }]
        const imageAnswer = await Inquirer.prompt(imageList)
        selectedImage = getPublicByName(configJson, imageAnswer.image)
        imageName = selectedImage.name;
        imageUrl = selectedImage.serveraddress + '/' + selectedImage.imageName;
        hostPort = selectedImage.hostPort;
        containerPort = selectedImage.containerPort;
    } else if (answers.source === 'private') {
        // 从私有仓库拉取镜像
        const choices = configJson.private.map(imageItem => ({
            name: `${imageItem.name} (${imageItem.imageName} @ ${imageItem.serveraddress})`,
            value: imageItem.name
        }));

        const imageList = [{
            type: 'list',
            message: '请选择镜像',
            name: 'image',
            choices,
        }]
        const imageAnswer = await Inquirer.prompt(imageList)
        selectedImage = getPrivateByName(configJson, imageAnswer.image)

        auth = selectedImage;
        imageName = selectedImage.imageName;
        imageUrl = selectedImage.serveraddress + '/' + selectedImage.imageName;
        hostPort = selectedImage.hostPort;
        containerPort = selectedImage.containerPort;
    }
    
    // 获取版本号
    const promptVersion = [
        {
            type: 'input',
            message: '请输入版本tag',
            name: 'tag',
            default: selectedImage.tag || "latest",
        },
    ];
    const version = await Inquirer.prompt(promptVersion)

    fullImageUrl = imageUrl + ':' + version.tag

    return {
        imageName,
        fullImageUrl,
        auth,
        hostPort,
        containerPort,
        hostVolume: selectedImage.hostVolume,
        containerVolume: selectedImage.containerVolume,
        env: selectedImage.env,
        restartPolicy: selectedImage.restartPolicy
    }
}