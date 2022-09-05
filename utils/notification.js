

var list_clients = []
function addClientToUser(client, userId){
    let tmp = list_clients[userId];
    if(!tmp || !Array.isArray(tmp)) tmp = [];
    client.user = userId;
    tmp.push(client);
    list_clients[userId] = tmp;
}
function removeClient(client){
    let userId = client.user;

    let clients = list_clients[userId];
    if (!clients || !Array.isArray(clients)) clients = [];
    clients = list_clients.filter((entity) => entity != client);
    list_clients[userId] = clients;
}

function getClientsOfUser(userId){
    let ans = list_clients[userId];
    if(!ans || !Array.isArray(ans)) return [];
    return ans;
} 

function sendNotification(client, type, message){
    let _data = {
        event: type,
        data: JSON.stringify(message),
    };
    let send_body = JSON.stringify(_data);
    client.send(send_body);
}

function sendNotificationToListClient(clients, type, message){
    if(!Array.isArray(clients)) return;
    for(let index = 0; index < clients.length; index++){
        sendNotification(clients[index], type, message);
    }
}

function sendNotificationToUser(userId, type, message){
    let clients = getClientsOfUser(userId);
    sendNotificationToListClient(clients, type, message);
}

function sendNotificationToListUsers(listUsers, type, message){
    for(let index = 0; index < listUsers.length; index++){
        let userId = listUsers[index].userId ?
            listUsers[index].userId :
            listUsers[index];
        sendNotificationToUser(userId, type, message);
    }
}
module.exports = {
    list_clients,
    addClientToUser,
    removeClient,
    getClientsOfUser,
    //send notification to client
    sendNotification,
    sendNotificationToListClient,
    sendNotificationToUser,
    sendNotificationToListUsers
};