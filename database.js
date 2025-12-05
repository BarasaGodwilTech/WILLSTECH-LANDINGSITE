// database.js - Create this new file
const DB = (function() {
    let db = null;
    
    function initDatabase() {
        // Create IndexedDB database (works in browser)
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('ReceiptingDB', 1);
            
            request.onerror = (event) => {
                console.error('Database error:', event.target.error);
                reject(event.target.error);
            };
            
            request.onupgradeneeded = (event) => {
                db = event.target.result;
                
                // Users table
                if (!db.objectStoreNames.contains('users')) {
                    const usersStore = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
                    usersStore.createIndex('username', 'username', { unique: true });
                    usersStore.createIndex('email', 'email', { unique: false });
                }
                
                // User sessions table
                if (!db.objectStoreNames.contains('sessions')) {
                    const sessionsStore = db.createObjectStore('sessions', { keyPath: 'userId' });
                    sessionsStore.createIndex('deviceId', 'deviceId', { unique: false });
                }
                
                // Receipt sequences table
                if (!db.objectStoreNames.contains('sequences')) {
                    db.createObjectStore('sequences', { keyPath: 'userId' });
                }
                
                // Receipts table
                if (!db.objectStoreNames.contains('receipts')) {
                    const receiptsStore = db.createObjectStore('receipts', { keyPath: 'id', autoIncrement: true });
                    receiptsStore.createIndex('receiptNumber', 'receiptNumber', { unique: true });
                    receiptsStore.createIndex('userId', 'userId', { unique: false });
                    receiptsStore.createIndex('date', 'transactionDate', { unique: false });
                }
                
                // Pending sync table
                if (!db.objectStoreNames.contains('pendingSync')) {
                    db.createObjectStore('pendingSync', { keyPath: 'id', autoIncrement: true });
                }
            };
            
            request.onsuccess = (event) => {
                db = event.target.result;
                resolve(db);
            };
        });
    }
    
    // User management functions
    async function createUser(userData) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['users'], 'readwrite');
            const store = transaction.objectStore('users');
            
            // Check if username exists
            const usernameIndex = store.index('username');
            const checkRequest = usernameIndex.get(userData.username);
            
            checkRequest.onsuccess = (event) => {
                if (event.target.result) {
                    reject(new Error('Username already exists'));
                    return;
                }
                
                // Create user
                const request = store.add(userData);
                
                request.onsuccess = () => {
                    resolve(request.result); // Returns user ID
                };
                
                request.onerror = (error) => {
                    reject(error);
                };
            };
        });
    }
    
    async function getUserByUsername(username) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['users'], 'readonly');
            const store = transaction.objectStore('users');
            const index = store.index('username');
            
            const request = index.get(username);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = (error) => {
                reject(error);
            };
        });
    }
    
    async function updateUser(userId, updates) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['users'], 'readwrite');
            const store = transaction.objectStore('users');
            
            const getRequest = store.get(userId);
            
            getRequest.onsuccess = () => {
                const user = getRequest.result;
                if (!user) {
                    reject(new Error('User not found'));
                    return;
                }
                
                Object.assign(user, updates);
                const updateRequest = store.put(user);
                
                updateRequest.onsuccess = () => {
                    resolve(user);
                };
                
                updateRequest.onerror = (error) => {
                    reject(error);
                };
            };
        });
    }
    
    // Session management
    async function saveSession(sessionData) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['sessions'], 'readwrite');
            const store = transaction.objectStore('sessions');
            
            const request = store.put(sessionData);
            
            request.onsuccess = () => {
                resolve();
            };
            
            request.onerror = (error) => {
                reject(error);
            };
        });
    }
    
    async function getSession(userId) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['sessions'], 'readonly');
            const store = transaction.objectStore('sessions');
            
            const request = store.get(userId);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = (error) => {
                reject(error);
            };
        });
    }
    
    async function deleteSession(userId) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['sessions'], 'readwrite');
            const store = transaction.objectStore('sessions');
            
            const request = store.delete(userId);
            
            request.onsuccess = () => {
                resolve();
            };
            
            request.onerror = (error) => {
                reject(error);
            };
        });
    }
    
    // Receipt sequence management
    async function getReceiptSequence(userId) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['sequences'], 'readwrite');
            const store = transaction.objectStore('sequences');
            
            const request = store.get(userId);
            
            request.onsuccess = () => {
                let sequence = request.result;
                
                if (!sequence) {
                    sequence = {
                        userId: userId,
                        lastNumber: 0,
                        pendingNumbers: [],
                        lastSync: new Date().toISOString()
                    };
                    
                    const putRequest = store.put(sequence);
                    putRequest.onsuccess = () => {
                        resolve(sequence);
                    };
                } else {
                    resolve(sequence);
                }
            };
            
            request.onerror = (error) => {
                reject(error);
            };
        });
    }
    
    async function updateReceiptSequence(userId, newSequence) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['sequences'], 'readwrite');
            const store = transaction.objectStore('sequences');
            
            const request = store.put(newSequence);
            
            request.onsuccess = () => {
                resolve();
            };
            
            request.onerror = (error) => {
                reject(error);
            };
        });
    }
    
    // Receipt management
    async function saveReceipt(receiptData) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['receipts'], 'readwrite');
            const store = transaction.objectStore('receipts');
            
            const request = store.add(receiptData);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = (error) => {
                reject(error);
            };
        });
    }
    
    async function getReceiptsByUser(userId, limit = 50) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['receipts'], 'readonly');
            const store = transaction.objectStore('receipts');
            const index = store.index('userId');
            
            const request = index.getAll(userId);
            
            request.onsuccess = () => {
                // Sort by date, newest first
                const receipts = request.result.sort((a, b) => 
                    new Date(b.transactionDate) - new Date(a.transactionDate)
                ).slice(0, limit);
                resolve(receipts);
            };
            
            request.onerror = (error) => {
                reject(error);
            };
        });
    }
    
    // Pending sync management
    async function addPendingSync(operation) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['pendingSync'], 'readwrite');
            const store = transaction.objectStore('pendingSync');
            
            const request = store.add({
                ...operation,
                createdAt: new Date().toISOString(),
                synced: false
            });
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = (error) => {
                reject(error);
            };
        });
    }
    
    async function getPendingSync() {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['pendingSync'], 'readonly');
            const store = transaction.objectStore('pendingSync');
            
            const request = store.getAll();
            
            request.onsuccess = () => {
                const pending = request.result.filter(op => !op.synced);
                resolve(pending);
            };
            
            request.onerror = (error) => {
                reject(error);
            };
        });
    }
    
    async function markSyncCompleted(id) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['pendingSync'], 'readwrite');
            const store = transaction.objectStore('pendingSync');
            
            const getRequest = store.get(id);
            
            getRequest.onsuccess = () => {
                const operation = getRequest.result;
                if (!operation) {
                    resolve();
                    return;
                }
                
                operation.synced = true;
                operation.syncedAt = new Date().toISOString();
                
                const updateRequest = store.put(operation);
                
                updateRequest.onsuccess = () => {
                    resolve();
                };
                
                updateRequest.onerror = (error) => {
                    reject(error);
                };
            };
        });
    }
    
    return {
        init: initDatabase,
        users: {
            create: createUser,
            getByUsername: getUserByUsername,
            update: updateUser
        },
        sessions: {
            save: saveSession,
            get: getSession,
            delete: deleteSession
        },
        sequences: {
            get: getReceiptSequence,
            update: updateReceiptSequence
        },
        receipts: {
            save: saveReceipt,
            getByUser: getReceiptsByUser
        },
        sync: {
            addPending: addPendingSync,
            getPending: getPendingSync,
            markCompleted: markSyncCompleted
        }
    };
})();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DB;
}