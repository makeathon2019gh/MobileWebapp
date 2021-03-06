const index = require('./index')

// Client -> Server
const LOGIN = 'LOGIN';
const DEST_REACHED = 'DEST_REACHED';
const LOG = 'LOG';
const STOP = 'STOP';

// Server -> Client
const TOKEN = 'TOKEN';
const GOTO = 'GOTO';
const BREAK = 'BREAK';
const CONTINUE = 'CONTINUE';

// Server -> User
const CART_DRIVING = 'CART_DRIVING';
const DONE = 'DONE';
const MESSAGE = 'MESSAGE';
const AUTH_STATUS = 'AUTH_STATUS';
const NEW_LOGIN = 'NEW_LOGIN';
//const DEST_REACHED = 'DEST_REACHED';

// User -> Server
//const GOTO = 'GOTO';
//const BREAK = 'BREAK';
//const CONTINUE = 'CONTINUE';
const AUTH = 'AUTH';


/** Handles incoming websocket messages */
exports.onWebsocketMessage = (message, connection) => {
    var cmd = message;
    var data = '';
    if (cmd.includes('=')) {
        cmd = cmd.split('=')[0];
        data = message.substring(cmd.length + 1);
    }

    switch (cmd) {
        // From carts

        case LOGIN:
            for (var id in index.carts) {
                var c = index.carts[id];
                if (c.clientsecret == data) {
                    c.socketconnection = connection;
                    c.newToken();
                    console.log(`Cart with id ${id} logged in. Token was set to ${c.authtoken}`);
                }
            }
            break;

        case DEST_REACHED:
            var cart = getCartByConnection(connection);
            if (cart == null) return;
            if (cart.userconnection == null) return;
            cart.userconnection.send(CART_DRIVING + '=false');
            cart.userconnection.send(DEST_REACHED);
            break;

        case STOP:
            var cart = getCartByConnection(connection);
            if (cart == null) return;
            if (cart.userconnection == null) return;
            cart.userconnection.send(CART_DRIVING + '=false');
            break;

        case LOG:
            var cart = getCartByConnection(connection);
            if (cart == null) return;
            if (cart.userconnection == null) return;
            cart.userconnection.send(MESSAGE + '=' + data);
            break;

        // From users

        case AUTH:
            var success = false;
            for (var id in index.carts) {
                var c = index.carts[id];
                if (c.authtoken == data) {
                    if (c.userconnection != null) c.userconnection.send(NEW_LOGIN);
                    c.userconnection = connection;
                    connection.send(AUTH_STATUS + '=success');
                    success = true;
                }
            }
            if (!success) connection.send(AUTH_STATUS + '=failed');
            break;

        case BREAK:
            var cart = getCartByUser(connection);
            if (cart == null) return;
            if (cart.socketconnection == null) return;
            cart.socketconnection.send(BREAK);
            break;

        case CONTINUE:
            var cart = getCartByUser(connection);
            if (cart == null) return;
            if (cart.socketconnection == null) return;
            cart.socketconnection.send(GOTO + '=' + cart.lasttarget);
            break;

        case GOTO:
            var cart = getCartByUser(connection);
            if (cart == null) return;
            if (cart.socketconnection == null) return;
            cart.lasttarget = data;
            cart.socketconnection.send(GOTO + '=' + cart.lasttarget);
            break;
    }
}

/** Handles user disconnecting */
exports.onWebsocketUserConnect = (connection) => {
    console.log('Client connected');
}

/** Handles user disconnecting */
exports.onWebsocketUserDisconnect = (connection) => {
    console.log('Client disconnected');
}

function getCartByConnection(connection) {
    for (var id in index.carts)
        if (index.carts[id].socketconnection == connection) return index.carts[id];
    return null;
}

function getCartByUser(connection) {
    for (var id in index.carts)
        if (index.carts[id].userconnection == connection) return index.carts[id];
    return null;
}