import Inquirer from "inquirer";
import {getPrivateByName, getPrivateName, getPublicByName, getPublicName} from "../../../utils/jsonUtils.js";

export default async function deployConfig(configJson) {
    // 填写容器镜像名称
    let imageName = ''
    let imageUrl = ''
    let hostPort = ''
    let containerPort = ''
    let selectedImage = null  

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
        containerPort
    }
}