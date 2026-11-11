import readline from 'readline';
import fs from 'fs';
import path from 'path';
import GroupService from '../services/groupService.js';

const lecturesPath = path.resolve('mcp-server/lectures.json');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

rl.on('line', async (line) => {
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
                    serverInfo: { name: "study-groups-mcp", version: "0.1.0" }
                }
            };
            process.stdout.write(JSON.stringify(response) + '\n');
        }
        else if (msg.method === 'notifications/initialized') {
            // No response required for notifications
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
                            name: "find_group",
                            description: "Return the details, member count, and topics of a specific study group by its unique ID. Use it when looking up group information.",
                            inputSchema: {
                                type: "object",
                                properties: {
                                    id: { type: "integer", description: "Group ID" }
                                },
                                required: ["id"]
                            }
                        },
                        {
                            name: "list_group_meetings",
                            description: "List all upcoming scheduled study meetings for a given group ID, including time and location details.",
                            inputSchema: {
                                type: "object",
                                properties: {
                                    groupId: { type: "integer", description: "Group ID" }
                                },
                                required: ["groupId"]
                            }
                        },
                        {
                            name: "search_study_material",
                            description: "Search through shared notes and resources uploaded within study groups based on keywords.",
                            inputSchema: {
                                type: "object",
                                properties: {
                                    query: { type: "string", description: "Search query keywords" }
                                },
                                required: ["query"]
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
            const userId = args.userId || 1;

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
            else {
                try {
                    let resultData;

                    if (toolName === 'find_group') {
                        resultData = await GroupService.getGroupDetails(args.id, userId);
                    }
                    else if (toolName === 'list_group_meetings') {
                        resultData = await GroupService.listUserDashboard(userId);
                    }
                    else if (toolName === 'search_study_material') {
                        resultData = await GroupService.searchMaterials(args.query, userId);
                    }
                    else {
                        // Protocol error for unknown tool (-32602)
                        process.stdout.write(JSON.stringify({
                            jsonrpc: "2.0",
                            id: msg.id,
                            error: {
                                code: -32602,
                                message: `Unknown tool: ${toolName}`
                            }
                        }) + '\n');
                        return;
                    }

                    process.stdout.write(JSON.stringify({
                        jsonrpc: "2.0",
                        id: msg.id,
                        result: {
                            content: [{ type: "text", text: JSON.stringify(resultData, null, 2) }],
                            isError: false
                        }
                    }) + '\n');

                } catch (toolError) {
                    process.stdout.write(JSON.stringify({
                        jsonrpc: "2.0",
                        id: msg.id,
                        result: {
                            content: [{ type: "text", text: toolError.message }],
                            isError: true
                        }
                    }) + '\n');
                }
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