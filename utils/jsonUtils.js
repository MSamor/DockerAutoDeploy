function getPublicName(json) {
    return json['public'].map((item) => item.name);
}

function getPublicByName(json, name) {
    return json['public'].find((item) => item.name === name);
}

function getPrivate(json) {
    return json['private'];
}

function getPrivateName(json) {
    return json['private'].map((item) => item.name);
}

function getPrivateByName(json, name) {
    return json['private'].find((item) => item.name === name);
}

export {
    getPrivate,
    getPublicName,
    getPublicByName,
    getPrivateName,
    getPrivateByName
}