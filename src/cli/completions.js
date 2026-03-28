function showHelp() {
  console.log(`
Usage: pingthings completions <shell>

Generate shell completion script.

Arguments:
  shell    bash, zsh, or fish

Install:
  pingthings completions bash >> ~/.bashrc
  pingthings completions zsh >> ~/.zshrc
  pingthings completions fish > ~/.config/fish/completions/pingthings.fish
`);
}

const COMMANDS = [
  'play', 'list', 'select', 'browse', 'search', 'sounds',
  'use', 'preview', 'test-events', 'theme', 'config',
  'init', 'create', 'install', 'uninstall', 'random-pack', 'doctor', 'completions',
];

const THEMES = [
  'retro', 'sci-fi', 'arena', 'fantasy', 'ancient',
  'professional', '8bit', 'space', 'chaos', 'reset',
];

const EVENTS = ['done', 'permission', 'complete', 'error', 'blocked'];

function bash() {
  return `# pingthings bash completions
_pingthings() {
  local cur prev commands
  COMPREPLY=()
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"
  commands="${COMMANDS.join(' ')}"

  case "\${prev}" in
    pingthings)
      COMPREPLY=( $(compgen -W "\${commands}" -- "\${cur}") )
      return 0
      ;;
    use|preview|sounds|test-events|uninstall)
      local packs=$(pingthings list 2>/dev/null | grep -oE '\\S+-\\S+' | head -20)
      COMPREPLY=( $(compgen -W "\${packs}" -- "\${cur}") )
      return 0
      ;;
    theme)
      COMPREPLY=( $(compgen -W "${THEMES.join(' ')}" -- "\${cur}") )
      return 0
      ;;
    --event|-e)
      COMPREPLY=( $(compgen -W "${EVENTS.join(' ')}" -- "\${cur}") )
      return 0
      ;;
    browse)
      local cats="military arena fantasy sci-fi fps retro ui transport spooky racing"
      COMPREPLY=( $(compgen -W "\${cats}" -- "\${cur}") )
      return 0
      ;;
    completions)
      COMPREPLY=( $(compgen -W "bash zsh fish" -- "\${cur}") )
      return 0
      ;;
  esac

  return 0
}
complete -F _pingthings pingthings`;
}

function zsh() {
  return `# pingthings zsh completions
_pingthings() {
  local -a commands themes events
  commands=(
    'play:Play a sound from the active pack'
    'list:Show available sound packs'
    'select:Interactive pack selector'
    'browse:Browse packs by category'
    'search:Search packs and sounds'
    'sounds:List individual sounds in a pack'
    'use:Set the active sound pack'
    'preview:Preview a random sound from a pack'
    'test-events:Play all event sounds'
    'theme:Apply a sound theme'
    'config:Show or update configuration'
    'init:Set up Claude Code hooks'
    'create:Create a pack from audio files'
    'install:Install a pack from GitHub or local path'
    'uninstall:Remove a user-installed pack'
    'random-pack:Switch to a random pack'
    'doctor:Diagnose audio setup'
    'completions:Generate shell completions'
  )
  themes=(${THEMES.join(' ')})
  events=(${EVENTS.join(' ')})

  _arguments '1:command:->cmds' '*::arg:->args'

  case "$state" in
    cmds)
      _describe -t commands 'pingthings command' commands
      ;;
    args)
      case $words[1] in
        use|preview|sounds|test-events|uninstall)
          local packs=($(pingthings list 2>/dev/null | grep -oE '\\S+-\\S+' | head -20))
          _describe -t packs 'pack' packs
          ;;
        theme)
          _describe -t themes 'theme' themes
          ;;
        browse)
          local cats=(military arena fantasy sci-fi fps retro ui transport spooky racing)
          _describe -t categories 'category' cats
          ;;
        completions)
          _describe -t shells 'shell' '(bash zsh fish)'
          ;;
      esac
      ;;
  esac
}
compdef _pingthings pingthings`;
}

function fish() {
  const lines = [
    '# pingthings fish completions',
    'complete -c pingthings -f',
  ];

  const cmdDescs = {
    play: 'Play a sound', list: 'Show packs', select: 'Interactive picker',
    browse: 'Browse by category', search: 'Search packs', sounds: 'List sounds',
    use: 'Set active pack', preview: 'Preview a pack', 'test-events': 'Test event sounds',
    theme: 'Apply a theme', config: 'Configuration', init: 'Set up hooks',
    create: 'Create a pack', install: 'Install a pack', uninstall: 'Remove a pack',
    'random-pack': 'Random pack', doctor: 'Diagnose setup', completions: 'Shell completions',
  };

  for (const [cmd, desc] of Object.entries(cmdDescs)) {
    lines.push(`complete -c pingthings -n '__fish_use_subcommand' -a '${cmd}' -d '${desc}'`);
  }

  for (const t of THEMES) {
    lines.push(`complete -c pingthings -n '__fish_seen_subcommand_from theme' -a '${t}'`);
  }

  for (const e of EVENTS) {
    lines.push(`complete -c pingthings -n '__fish_seen_subcommand_from play' -l 'event' -a '${e}'`);
  }

  return lines.join('\n');
}

export default function completions(args) {
  const shell = args[0];

  if (!shell || shell === '--help' || shell === '-h') {
    showHelp();
    if (!shell) process.exit(1);
    return;
  }

  switch (shell) {
    case 'bash':
      console.log(bash());
      break;
    case 'zsh':
      console.log(zsh());
      break;
    case 'fish':
      console.log(fish());
      break;
    default:
      console.error(`Unknown shell: ${shell}. Use bash, zsh, or fish.`);
      process.exit(1);
  }
}
