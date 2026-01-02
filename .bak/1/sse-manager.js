export class SSEManager {

    constructor(){
        this.clients = new Map();
        this.heartbeatInterval = null;
        this.startHeartbeat();
    }
    
    addClient(clientId,response) {
        response.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        })
        this.sendToClient(response, 'connected', { clientId, timestamp: Date.now() })
        this.clients.set(clientId, {
            response,
            lastActivity: Date.now()
        });
        response.on('close', ()=>{
            this.removeClient(clientId)
        })

        return clientId;
    }

    startHeartbeat(){
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval)
        }
        this.heartbeatInterval = setInterval(() => {
            const now = Date.now();
            const timeout = 300000;
            for (const [clientId,client] of this.clients.entries()) {
                if (now - client.lastActivity > timeout) {
                    console.log(`Client ${clientId} timed out`)
                    this.removeClient(clientId)
                    continue;
                }

                this.sendToClient(client.response, 'heartbeat', { timestamp: now })
            }
        }, 30000);
    }

    removeClient(clientId){
        if (this.clients.has(clientId)) {
            this.clients.delete(clientId);
        }
    }
  
    broadcast(event, data) {
        const timestamp = Date.now();
        let successCount = 0;
        let failedClients = [];

        for (const [clientId,client] of this.clients.entries()){
            const success = this.sendToClient(client.response,event,{
                ...data,
                timestamp
            })
            if (success) {
                client.lastActivity = timestamp;
                successCount++;
            }else {
                failedClients.push(clientId);
            }
        }

        failedClients.forEach(clientId => this.removeClient(clientId));
        
        return successCount; // 返回成功发送的客户端
    }

    sendToClient(response, event, data) {
        try {
            response.write(`event: ${event}\n`);
            response.write(`data: ${JSON.stringify(data)}\n\n`);
            return true;
        } catch (error) {
            return false;
        }
    }

    sendToClientById(clientId, event, data) {
        const client = this.clients.get(clientId);
        if (!client) {
            console.warn(`[sse] Client ${clientId} not found for send`)
            return false
        }
        const success = this.sendToClient(client.response, event, {
            ...data,
            timestamp: Date.now()
        })
        if(success) {
            client.lastActivity = Date.now();
        }else {
            this.removeClient(clientId)
        }
        return success;
    }

    closeAll(){
        for (const [clientId, client] of this.clients.entries()) {
            try {
                client.response.end()
            } catch (error) {
                console.error(`[sse] Error closing client ${clientId}:`, error.message)
            }
        }
        this.clients.clear();
        this.stopHearbeat();
    }

    stopHearbeat(){
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }
    
}