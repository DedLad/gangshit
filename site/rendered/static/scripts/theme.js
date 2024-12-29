document.addEventListener('keydown', (event) => {
    const terminal = document.getElementById('terminal');
    if (event.key === 'Escape') {
      terminal.classList.toggle('hidden');
    } else if (terminal.classList.contains('hidden')) {
      terminal.classList.remove('hidden');
      document.getElementById('terminal-input').focus();
    }
  });
  
  document.getElementById('terminal-input').addEventListener('keydown', async (event) => {
    if (event.key === 'Enter') {
      const input = event.target.value;
      const output = document.getElementById('terminal-output');
      const command = input.split(' ')[0];
      const args = input.split(' ').slice(1).join(' ');
  
      switch (command) {
        case 'PWD':
          output.innerHTML += `<div>${window.location.pathname}</div>`;
          break;
        case 'grep':
          await grepCommand(args, output);
          break;
        case 'ls':
          await lsCommand(output);
          break;
        case 'cd':
          cdCommand(args);
          break;
        case 'tags':
          await tagsCommand(output);
          break;
        case 'collections':
          await collectionsCommand(output);
          break;
        default:
          output.innerHTML += `<div>Unknown command: ${command}</div>`;
      }
  
      event.target.value = '';
      output.scrollTop = output.scrollHeight;
    }
  });
  
  async function grepCommand(args, output) {
    const response = await fetch('/rendered/index.json');
    const data = await response.json();
    const results = [];
  
    for (const page of data.pages) {
      if (page.tags.includes(args) || page.collections.includes(args)) {
        results.push(page.url);
      }
    }
  
    if (results.length > 0) {
      results.forEach(result => {
        output.innerHTML += `<div>${result}</div>`;
      });
    } else {
      output.innerHTML += `<div>No results found for: ${args}</div>`;
    }
  }
  
  async function lsCommand(output) {
    const response = await fetch('/rendered/index.json');
    const data = await response.json();
  
    data.pages.forEach(page => {
      output.innerHTML += `<div>${page.url}</div>`;
    });
  }
  
  function cdCommand(args) {
    window.location.href = args;
  }
  
  async function tagsCommand(output) {
    const response = await fetch('/rendered/index.json');
    const data = await response.json();
    const tags = new Set();
  
    data.pages.forEach(page => {
      page.tags.forEach(tag => {
        tags.add(tag);
      });
    });
  
    tags.forEach(tag => {
      output.innerHTML += `<div>${tag}</div>`;
    });
  }
  
  async function collectionsCommand(output) {
    const response = await fetch('/rendered/index.json');
    const data = await response.json();
    const collections = new Set();
  
    data.pages.forEach(page => {
      page.collections.forEach(collection => {
        collections.add(collection);
      });
    });
  
    collections.forEach(collection => {
      output.innerHTML += `<div>${collection}</div>`;
    });
  }