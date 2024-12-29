// static/scripts/terminal.js
class Terminal {
  constructor() {
    this.terminal = document.querySelector(".terminal-wrapper");
    this.output = document.querySelector(".terminal-output");
    this.input = document.querySelector(".terminal-input");
    this.toggleBtn = document.querySelector(".terminal-toggle");
    this.closeBtn = document.querySelector(".terminal-close");
    this.currentPath = window.location.pathname;

    this.commands = {
      help: this.showHelp.bind(this),
      pwd: this.showCurrentPath.bind(this),
      cd: this.navigate.bind(this),
      grep: this.search.bind(this),
      clear: this.clear.bind(this),
      ls: this.listContents.bind(this),
    };

    this.setupEventListeners();
    this.siteData = null;
    this.fetchSiteData();
  }

  async fetchSiteData() {
    try {
      const response = await fetch("/static/index.json");
      this.siteData = await response.json();
    } catch (error) {
      console.error("Error fetching site data:", error);
    }
  }

  setupEventListeners() {
    const body = document.querySelector("body");
    body.addEventListener("keydown", () => {
      if (this.terminal.style.display === "none") {
        this.terminal.style.display = "block";
        this.input.focus();
      }
    });

    this.closeBtn.addEventListener("click", () => {
      this.terminal.style.display = "none";
    });

    this.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this.handleCommand();
      }
    });
  }

  println(text, color = "var(--fg)") {
    const line = document.createElement("div");
    line.style.color = color;
    line.innerHTML = text;
    this.output.appendChild(line);
    this.output.scrollTop = this.output.scrollHeight;
  }

  handleCommand() {
    const cmdLine = this.input.value.trim();
    this.println(`Guldu@term:~$ ${cmdLine}`, "var(--green)");

    if (cmdLine) {
      const [cmd, ...args] = cmdLine.split(" ");

      if (this.commands[cmd]) {
        this.commands[cmd](args);
      } else {
        this.println(
          `Command not found: ${cmd}. Type 'help' for available commands.`,
          "var(--red)",
        );
      }
    }

    this.input.value = "";
  }

  showHelp() {
    const helpText = `
Available commands:
  pwd           - Print current page path
  cd <path>     - Navigate to a page (e.g., cd index, cd posts/my-post)
  ls            - List available pages in current directory
  grep <term>   - Search for content containing the term
  clear         - Clear terminal output
  help          - Show this help message
`;
    this.println(helpText, "var(--yellow)");
  }

  showCurrentPath() {
    this.println(this.currentPath);
  }

  navigate(args) {
    if (!args.length) {
      this.println("Usage: cd <path>", "var(--red)");
      return;
    }

    let path = args[0];
    if (!path.endsWith(".html")) {
      path += ".html";
    }

    if (path.startsWith("/")) {
      path = path.slice(1);
    }

    // Check if path exists in site data
    let pageExists = false;
    Object.keys(this.siteData).forEach((key) => {
      const page = this.siteData[key];

      if (page.CompleteURL === path) {
        pageExists = true;
      }
    });

    if (pageExists) {
      window.location.href = "/" + path;
    } else {
      this.println(`Path not found: ${path}`, "var(--red)");
    }
  }

  async search(args) {
    if (!args.length) {
      this.println("Usage: grep <search-term>", "var(--red)");
      return;
    }

    const term = args.join(" ").toLowerCase();
    let results = [];
    Object.keys(this.siteData).forEach((key) => {
      const page = this.siteData[key];

      if (page["Tags"] != null) {
        console.log(page["Tags"]);
        for (let tag of page["Tags"]) {
          tag = tag.toLowerCase();
          console.log(tag);
          if (tag == term) {
            results.push(page);
          }
        }
      }
    });

    if (results?.length) {
      this.println(`Found ${results.length} results:`, "var(--yellow)");
      results.forEach((page) => {
        this.println(
          `- ${page.CompleteURL}: <a href="/${page.CompleteURL}">${page.CompleteURL}</a>`,
          "var(--aqua)",
        );
      });
    } else {
      this.println(`No results found for: ${term}`, "var(--red)");
    }
  }

  listContents() {
    const currentDir = this.currentPath.split("/").slice(0, -1).join("/");
    if (this.siteData) {
      console.log("enter 1");
      Object.keys(this.siteData).forEach((key) => {
        const page = this.siteData[key];
        console.log("enter 2");
        this.println(`- ${page.CompleteURL}`, "var(--aqua)");
      });
    } else {
      console.log("enter 3");
      this.println("No pages found in current directory", "var(--gray)");
    }
  }

  clear() {
    this.output.innerHTML = "";
  }
}

// Initialize terminal when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new Terminal();
});
