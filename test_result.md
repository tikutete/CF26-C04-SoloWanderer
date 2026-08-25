#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  SABRE - Spatial Attack Behaviour Reconstruction Engine. Import existing project and run it.
  New feature: Visualize the attack path in the Network View. When Auto-Defense is OFF, as the
  attacker progresses through the device Terminal chain, each accessed device should glow red
  (flickering) in the Network View and its connection line(s) should turn red, tracing the route
  upward across floors. Reset via a "Reset attack path" button. Also fix: Floor-2 Wi-Fi AP and
  Badge Reader should connect under the Floor-2 switch (they were rendering like stray links).

frontend:
  - task: "Hardware demo event bridge (backend /api/demo/*)"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        - working: "NA"
          agent: "main"
          comment: |
            Added backend event bridge for external hardware (ESP32 RFID + Termux phone):
            POST /api/demo/rfid {uid} -> assigns floor by scan order (1st=F1, 2nd=F2, 3rd+=floor null/ignored),
            name=ARNAV if uid==BA:0D:A2:16 (case-insensitive) else VED; POST /api/demo/ssh {key};
            POST /api/demo/openconfig; POST /api/demo/reset (clears); GET /api/demo/events (sorted by ts).
            Stored in Mongo collection demo_events with uuid id + ts. TEST: reset, then 3 rfid scans
            (verify floors 1,2,null and names), ssh, openconfig, GET events returns all in order, reset clears.
  - task: "Attack-path red glow in Network View driven by Terminal chain"
    implemented: true
    working: "NA"
    file: "frontend/src/components/NetworkView.js, frontend/src/components/TerminalWindow.js, frontend/src/App.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        - working: "NA"
          agent: "main"
          comment: |
            Implemented. App holds autoDefense (default ON) + compromisedIps state. TerminalWindow
            emits onCompromise(ip) at each attack step: ssh login to 10.0.1.10 (Lobby Kiosk),
            ssh login to 10.0.1.12 (Reception PC 2), smb://10.0.3.20 (File Storage Unit 2, F3),
            login exec_2 -> 10.0.4.18 (Dev Server 2, F4), ssh back_serv_01 -> Backup Server (F5, real ip 10.0.5.16).
            NetworkView shows red flicker glow + pulsing COMPROMISED ring on compromised chips,
            red device->switch links, and a red vertical backbone spine spanning compromised floors
            ONLY when Auto-Defense is OFF. Reset button clears the path.
            TEST FLOW: (1) Toggle Auto-Defense OFF (toolbar). (2) Explore Floor 1, click the Lobby Kiosk
            device, Open Terminal Screen. (3) Run: ssh 10.0.1.10 -> login C4entrp / root ; ip neigh ;
            ssh 10.0.1.12 -> recep2 / lobby2 ; nmap ; smb://10.0.3.20/memo ; login exec_2 --user dsvr_backup ;
            ssh back_serv_01 --user srv_backup ; sudo apt purge -> Y. (4) Open Network View and verify each
            accessed device glows red progressively and links/backbone turn red. (5) Click Reset attack path -> clears.
            (6) With Auto-Defense ON, path must be hidden (header shows "Auto-Defense ON - path hidden").
  - task: "Floor-2 Wi-Fi AP and Badge Reader connected under Floor-2 switch in Network View"
    implemented: true
    working: true
    file: "frontend/src/components/NetworkView.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "buildLayout floor-2 transform: only the switch is a hub; Wi-Fi AP + Badge Reader are now endpoints under the switch. Visually confirmed via screenshot - badge is inline in the switch row, no stray mini-group."
  - task: "Auto-Defense ON defensive demo (SABRE panel + reconstruction)"
    implemented: true
    working: "NA"
    file: "frontend/src/hooks/useDefenseEngine.js, frontend/src/components/SabreDefensePanel.js, frontend/src/components/NetworkView.js, frontend/src/components/TerminalWindow.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        - working: "NA"
          agent: "main"
          comment: |
            With Auto-Defense ON (default), the Network View shows a right-side translucent-red SABRE DEFENSE
            panel (verified rendering: Safety Score idle rand 92-98 every 2s, streaming telemetry).
            TEST FLOW (Auto-Defense ON): Explore Floor 1 -> click Lobby Kiosk -> Open Terminal Screen.
            Keep Network View open (terminal stays on top). Run in terminal:
              1) ssh 10.0.1.10 ; login C4entrp / root  -> panel: telemetry preempt yellow "UNAUTHORIZED AUTH" 5s;
                 Safety Score -> 82, area amber 2s, back to idle.
              2) ip neigh  -> no reaction.
              3) ssh 10.0.1.12 ; login recep2 / lobby2  -> alert "Reception PC 2 is accessed by Kiosk"; score dips to 72.
              4) nmap  -> alert "Suspicious activity detected - recep2 never initiated a network scan".
              5) smb://10.0.3.20/memo  -> TERMINAL halts, spams "NT_STATUS_ACCESS_DENIED" 3x (1s apart) then
                 "Connection terminated by SABRE Auto-Defense". Panel: "POTENTIAL LATERAL ENTRY detected",
                 after 2s Safety Score -> 24 CRITICAL red + alert "SPREAD STOPPED".
                 Then staged reconstruction in topology: "Reconstructing potential attack path..." ->
                 dotted rings over File Storage Unit 1 & 2 (F3) -> dotted line to Dev Server 2 (F4) ->
                 dotted line to Backup Server (F5). Panel then shows analysis: Attack type "Internal Spearphishing"
                 (highlighted), MITRE T1534, reason bullets, and "Show more details" -> 7-step MITRE breakdown
                 with attack types highlighted.
              6) In ON mode, "login exec_2" and "ssh back_serv_01" must be BLOCKED with an Auto-Defense message.
            Reset attack path button clears everything. Toggling Auto-Defense OFF should hide the panel and
            instead reveal the OFF-mode red compromised-device glow path.
        - working: "NA"
          agent: "main"
          comment: |
            EDIT (user-requested): (1) The reconstruction now also draws the dotted path from the ATTACK ORIGIN -
            dotted rings on Lobby Kiosk (10.0.1.10) and Reception PC 2 (10.0.1.12) with dotted lines
            Kiosk -> Reception PC 2 -> File Storage (F3) -> Dev Server 2 (F4) -> Backup Server (F5), all at reconStage>=2..4.
            (2) "Show more details" now opens a SEPARATE MODAL WINDOW (data-testid "sabre-details-modal", title
            "ATTACK STEP BREAKDOWN", close button data-testid "sabre-details-close") containing the 7 attack steps
            with MITRE IDs and highlighted attack types - instead of expanding inline. Please retest the full ON flow
            and confirm both edits.
        - working: "NA"
          agent: "main"
          comment: |
            EDIT 2 (user-requested): Analysis card "Potential reason" bullets changed to:
            (1) "Lobby's Kiosk and Reception PC 2 share the same admin account." and
            (2) "The memo on 10.0.3.20 stored the saved passwords of Executive PC 2."
            Added new "Target and purpose" section below it: "The attack was aimed at the Backup Server of the
            server floor, because of the presence of backup files referenced in the script."
            In the "Show more details" modal (ATTACK STEP BREAKDOWN) the MITRE + Attack type text was made larger
            and non-thin (13px / medium+bold) for readability.

metadata:
  created_by: "main_agent"
  version: "1.1"
  test_sequence: 0
  run_ui: false

test_plan:
  current_focus:
    - "Auto-Defense ON defensive demo (SABRE panel + reconstruction)"
    - "Attack-path red glow in Network View driven by Terminal chain"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
    - agent: "main"
      message: "Frontend-only feature (no backend changes). Please test the attack-path glow flow as described in the task's status_history TEST FLOW. Verify progressive red glow, red links, red backbone spine, Reset button, and that ON hides the path."
