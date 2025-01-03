class Terminal {
  constructor() {
    this.terminal = document.querySelector(".terminal-wrapper");
    this.output = document.querySelector(".terminal-output");
    this.input = document.querySelector(".terminal-input");
    this.toggleBtn = document.querySelector(".terminal-toggle");
    this.closeBtn = document.querySelector(".terminal-close");
    this.currentPath = window.location.pathname;
    this.navbar = document.querySelector(".responsive-header");
    this.contentIndex = {};

    this.navbar.style.display = getComputedStyle(this.navbar).display;

    this.commands = {
      help: this.showHelp.bind(this),
      pwd: this.showCurrentPath.bind(this),
      cd: this.navigate.bind(this),
      grep: this.search.bind(this),
      clear: this.clear.bind(this),
      ls: this.listContents.bind(this),
      "toggle-navbar": this.toggleNavbar.bind(this),
    };

    this.setupEventListeners();
    this.siteData = null;
    this.fetchSiteData().then(() => this.buildContentIndex());
  }

  async fetchSiteData() {
    try {
      const response = await fetch("/static/index.json");
      this.siteData = await response.json();
    } catch (error) {
      console.error("Error fetching site data:", error);
    }
  }

  async buildContentIndex() {
    var parser = new DOMParser();
    if (!this.siteData) return;
    for (const key of Object.keys(this.siteData)) {
      const page = this.siteData[key];
      try {
        const response = await fetch("/" + page.CompleteURL);
        var data = await response.text();
        const content = parser.parseFromString(data, "text/html").querySelector(".body").textContent;
        this.contentIndex[key] = {
          content: content.toLowerCase(),
          url: page.CompleteURL,
          title: page.Frontmatter?.Title || page.CompleteURL,
          description: page.Frontmatter?.Description || "",
          tags: page.Tags || []
        };
      } catch (error) {
        console.error(`Error fetching content for ${page.CompleteURL}:`, error);
      }
    }
    // console.log("Content index built:", this.contentIndex);
  }

  setupEventListeners() {
    const body = document.querySelector("body");
    body.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.terminal.style.display = "none";
      } else if (this.terminal.style.display === "none") {
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
      } else if (e.key === "Tab") {
        e.preventDefault();
        this.autoComplete();
      }
    });

    this.terminal.addEventListener("click", () => {
      this.input.focus();
    });
  }

  println(text, color = "var(--fg)") {
    const line = document.createElement("div");
    line.style.color = color;
    line.innerHTML = text;
    this.output.appendChild(line);
    this.scrollToBottom();
  }

  handleCommand() {
    const cmdLine = this.input.value.trim();
    this.println(`guest@internethome:~$ ${cmdLine}`, "var(--green)");

    if (cmdLine) {
      const [cmd, ...args] = cmdLine.split(" ");
      if (this.commands[cmd]) {
        this.commands[cmd](args);
      } else {
        this.println(
          `Command not found: ${cmd}. Type 'help' for available commands.`,
          "var(--red)"
        );
      }
    }

    this.input.value = "";
    this.scrollToBottom();
  }

  scrollToBottom() {
    this.output.scrollTop = this.output.scrollHeight;
  }

  showHelp() {
    const helpText = `<pre style="font-family:IosevkaRegular;">
Available commands:
  pwd           - Print current page path
  cd <path>           - Navigate to a page (e.g., cd posts/building-anna/index.html)
  ls            - List available pages on the site
  grep <term>         - Search for content containing the term
  clear         - Clear terminal output
  help          - Show this help message
  toggle-navbar - Toggle the visibility of the navbar
</pre>`;
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
    const results = new Set();
  
    for (const key of Object.keys(this.siteData)) {
      const page = this.siteData[key];
      let found = false;
  
      if (page.Tags?.some((tag) => tag.toLowerCase().includes(term))) {
        found = true;
      }
      if (
        page.Frontmatter?.Title?.toLowerCase().includes(term) ||
        page.Frontmatter?.Description?.toLowerCase().includes(term)
      ) {
        found = true;
      }
  
      if (found) {
        results.add(key);
      }
    }
  
    for (const key of Object.keys(this.contentIndex)) {
      const data = this.contentIndex[key];
      if (data.content.includes(term)) {
        results.add(key);
      }
    }
  
    if (results.size > 0) {
      this.println(`Found ${results.size} results:`, "var(--yellow)");
      results.forEach((key) => {
        const page = this.siteData[key];
        this.println(
          `<a href="/${page.CompleteURL}">${page.CompleteURL}</a>`,
          "var(--aqua)"
        );
      });
    } else {
      this.println(`No results found for: ${term}`, "var(--red)");
    }
  }

  listContents() {
    const currentDir = this.currentPath.split("/").slice(0, -1).join("/");
    if (this.siteData) {
      Object.keys(this.siteData).forEach((key) => {
        const page = this.siteData[key];
        this.println(`- ${page.CompleteURL}`, "var(--aqua)");
      });
    } else {
      this.println("No pages found in current directory", "var(--gray)");
    }
  }

  clear() {
    this.output.innerHTML = "";
    this.scrollToBottom();
  }

  toggleNavbar() {
    if (this.navbar.style.display === "none") {
      this.navbar.style.display = "block";
    } else {
      this.navbar.style.display = "none";
    }
  }

  autoComplete() {
    const inputValue = this.input.value.trim();
    const [cmd, ...args] = inputValue.split(" ");
    const possibleCommands = Object.keys(this.commands).filter((command) =>
      command.startsWith(cmd)
    );

    if (args.length === 0) {
      if (possibleCommands.length === 1) {
        this.input.value = `${possibleCommands[0]} `;
      } else if (possibleCommands.length > 1) {
        this.println(`Possible commands: ${possibleCommands.join(", ")}`, "var(--yellow)");
      }
    } else if (cmd === "cd") {
      const partialPath = args.join(" ");
      const possiblePaths = Object.keys(this.siteData).filter((key) =>
        key.startsWith(partialPath)
      );

      if (possiblePaths.length === 1) {
        this.input.value = `cd ${possiblePaths[0]}`;
      } else if (possiblePaths.length > 1) {
        const commonPrefix = this.findCommonPrefix(possiblePaths);
        this.input.value = `cd ${commonPrefix}`;
        this.println(`Possible paths: ${possiblePaths.join(", ")}`, "var(--yellow)");
      }
    } else if (cmd === "grep") {
      const partialTag = args.join(" ").toLowerCase();
      const possibleTags = [];

      Object.keys(this.siteData).forEach((key) => {
        const page = this.siteData[key];
        if (page["Tags"] != null) {
          page["Tags"].forEach((tag) => {
            if (tag.toLowerCase().startsWith(partialTag) && !possibleTags.includes(tag)) {
              possibleTags.push(tag);
            }
          });
        }
      });

      if (possibleTags.length === 1) {
        this.input.value = `grep ${possibleTags[0]}`;
      } else if (possibleTags.length > 1) {
        const commonPrefix = this.findCommonPrefix(possibleTags);
        this.input.value = `grep ${commonPrefix}`;
        this.println(`Possible tags: ${possibleTags.join(", ")}`, "var(--yellow)");
      }
    }
  }

  findCommonPrefix(strings) {
    if (!strings.length) return '';
    const sortedStrings = strings.slice().sort();
    const first = sortedStrings[0];
    const last = sortedStrings[sortedStrings.length - 1];
    let i = 0;
    while (i < first.length && first[i] === last[i]) {
      i++;
    }
    return first.slice(0, i);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new Terminal();
});