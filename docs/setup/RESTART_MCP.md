# MCP Restart Instructions

After running the fix script, you need to restart Claude Desktop for changes to take effect:

## macOS:
1. Right-click Claude Desktop icon in dock
2. Select Quit
3. Relaunch Claude Desktop from Applications

## Windows:
1. Right-click Claude Desktop in system tray
2. Select Exit
3. Relaunch from Start Menu

## Linux:
1. Kill Claude process: `pkill claude`
2. Relaunch from terminal or applications menu

## Verify MCP Tools:
1. Open Claude Desktop
2. Start a new chat
3. Type: "What MCP tools are available?"
4. You should see tools like:
   - File system operations
   - Git operations
   - Task management
   - Memory management
   - GitHub integration
   - etc.

If tools don't appear:
1. Check Claude Desktop logs (Help → Show Logs)
2. Run the diagnostics script: `./scripts/mcp-diagnostics.sh`
3. Ensure no firewall blocking connections
