const axios = require("axios");

try {

    axios.get("http://138.68.128.105/api/v1/token/get-token?username=admin").then((res) => {
        console.log(res);
    }).catch((e) => {
        console.log("S-->", e);
    })
} catch(e) {
    console.log(e);
}