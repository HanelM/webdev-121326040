import readline from 'readline';
import fs from 'fs';
import path from 'path';
import GroupService from '../services/groupService.js';

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
                            name: "find_group",
                            description: "Return the details, member count, and topics of a specific study group by its unique ID. Use it when looking up group information.",
                            inputSchema: {
                                type: "object",
                                properties: {
                                    id: { type: "integer", description: "Group ID" },
                                    userId: { type: "integer", description: "Caller user ID" }
                                },
                                required: ["id"]
                            }
                        },
                        {
                            name: "list_group_meetings",
                            description: "List all upcoming scheduled study meetings for a given user dashboard or group.",
                            inputSchema: {
                                type: "object",
                                properties: {
                                    userId: { type: "integer", description: "Caller user ID" }
                                },
                                required: []
                            }
                        },
                        {
                            name: "search_study_material",
                            description: "Search through shared notes and resources uploaded within study groups based on keywords.",
                            inputSchema: {
                                type: "object",
                                properties: {
                                    query: { type: "string", description: "Search query keywords" },
                                    userId: { type: "integer", description: "Caller user ID" }
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
            const userId = args.userId || 1; // MCP server knows who is calling

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
                    throw new Error(`Unknown tool: ${toolName}`);
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