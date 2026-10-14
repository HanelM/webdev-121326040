import readline from 'readline';
import fs from 'fs';
import path from 'path';

const lecturesPath = path.resolve('mcp-server/lectures.json');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

rl.on('line', (line) => {
    console.error(`got: ${line}`);

    try {
        const msg = JSON.parse(line);

        if (msg.method === 'initialize') {
            const protocolVersion = msg.params?.protocolVersion || "2025-11-25";
            const response = {
                jsonrpc: "2.0",
                id: msg.id,
                result: {
                    protocolVersion: protocolVersion,
                    capabilities: { tools: {} },
                    serverInfo: { name: "lectures", version: "0.1.0" }
                }
            };
            process.stdout.write(JSON.stringify(response) + '\n');
        }
        else if (msg.method === 'notifications/initialized') {
            // Известието няма id и не получава отговор
        }
        else if (msg.method === 'tools/list') {
            const response = {
                jsonrpc: "2.0",
                id: msg.id,
                result: {
                    tools: [
                        {
                            name: "find_lecture",
                            description: "Return the title and topics of one course lecture by its number, 1 to 10. Use it when asked what a lecture covers. Returns one line of text.",
                            inputSchema: {
                                type: "object",
                                properties: {
                                    number: {
                                        type: "integer",
                                        description: "Lecture number, 1 to 10"
                                    }
                                },
                                required: ["number"]
                            }
                        },
                        {
                            name: "get_server_status",
                            description: "Returns the current operational status and uptime details of the MCP server for diagnostic and health monitoring purposes.",
                            inputSchema: {
                                type: "object",
                                properties: {},
                                required: []
                            }
                        }
                    ]
                }
            };
            process.stdout.write(JSON.stringify(response) + '\n');
        }
        else if (msg.method === 'tools/call') {
            const toolName = msg.params?.name;
            const args = msg.params?.arguments || {};

            if (toolName === 'find_lecture') {
                const lectureNum = args.number;
                const lecturesData = JSON.parse(fs.readFileSync(lecturesPath, 'utf8'));
                const lecture = lecturesData.find(l => l.number === lectureNum);

                if (lecture) {
                    const topicsStr = Array.isArray(lecture.topics)
                        ? lecture.topics.join(', ')
                        : lecture.topics;
                    const text = `Lecture ${lecture.number}: ${lecture.title}. Topics: ${topicsStr}`;

                    process.stdout.write(JSON.stringify({
                        jsonrpc: "2.0",
                        id: msg.id,
                        result: {
                            content: [{ type: "text", text: text }],
                            isError: false
                        }
                    }) + '\n');
                } else {
                    process.stdout.write(JSON.stringify({
                        jsonrpc: "2.0",
                        id: msg.id,
                        result: {
                            content: [{ type: "text", text: `There is no lecture ${lectureNum}. The course has lectures 1 to 10.` }],
                            isError: true
                        }
                    }) + '\n');
                }
            }
            else if (toolName === 'get_server_status') {
                process.stdout.write(JSON.stringify({
                    jsonrpc: "2.0",
                    id: msg.id,
                    result: {
                        content: [{ type: "text", text: "Server is up and running smoothly." }],
                        isError: false
                    }
                }) + '\n');
            }
            else {
                process.stdout.write(JSON.stringify({
                    jsonrpc: "2.0",
                    id: msg.id,
                    error: {
                        code: -32602,
                        message: `Unknown tool: ${toolName}`
                    }
                }) + '\n');
            }
        }
        else {
            if (msg.id !== undefined) {
                process.stdout.write(JSON.stringify({
                    jsonrpc: "2.0",
                    id: msg.id,
                    error: {
                        code: -32601,
                        message: `Unknown method: ${msg.method}`
                    }
                }) + '\n');
            }
        }
    } catch (e) {
        console.error("Error processing line:", e.message);
    }
});