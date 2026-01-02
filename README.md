# Minecraft Auto Miner

An intelligent automation tool for Minecraft that enables automated mining operations, resource gathering, and efficiency optimization.

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Usage](#usage)
- [Advanced Features](#advanced-features)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Features

✨ **Core Features:**
- **Automated Mining**: Automatically mines selected ore types with intelligent pathfinding
- **Resource Management**: Smart inventory management and resource routing
- **Multi-threaded Operations**: Parallel mining processes for enhanced efficiency
- **Configurable Mining Patterns**: Multiple mining strategies (spiral, grid, depth-first)
- **Real-time Monitoring**: Live statistics and mining progress tracking
- **Safe Mode**: Automatic danger detection and avoidance
- **Logging System**: Comprehensive logging for debugging and analysis

🎯 **Advanced Capabilities:**
- Custom ore blacklist/whitelist system
- Automatic refueling and tool management
- Multi-dimension support
- Adaptive difficulty settings
- Performance optimization tools
- Network-compatible mining coordination

## Requirements

- **Minecraft Version**: 1.16 or higher
- **Java Version**: Java 11 or higher
- **RAM**: Minimum 2GB, recommended 4GB+
- **Disk Space**: 500MB for full installation
- **Dependencies**:
  - Minecraft Server or Client with modding support
  - Fabric/Forge mod loader (depending on configuration)
  - Python 3.8+ (if using the control interface)

## Installation

### Option 1: Direct Installation

1. **Download the latest release**:
   ```bash
   git clone https://github.com/duyanhggg/minecraft-auto-miner.git
   cd minecraft-auto-miner
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure your settings**:
   ```bash
   cp config.example.yaml config.yaml
   # Edit config.yaml with your preferences
   ```

4. **Run the miner**:
   ```bash
   python main.py
   ```

### Option 2: Docker Installation

```bash
docker build -t minecraft-auto-miner .
docker run -it --name miner minecraft-auto-miner
```

### Option 3: Using Package Manager

```bash
# Coming soon
pip install minecraft-auto-miner
```

## Quick Start

### Basic Setup (5 minutes)

1. **Start with default configuration**:
   ```bash
   python main.py --default-config
   ```

2. **Select your mining mode**:
   ```
   > 1: Aggressive (Fast, high resource usage)
   > 2: Balanced (Recommended for most servers)
   > 3: Efficient (Slow, minimal resource usage)
   > 4: Custom
   ```

3. **Specify target ores**:
   ```bash
   python main.py --ores diamond,gold,iron
   ```

4. **Monitor progress**:
   - Open the control panel at `http://localhost:5000`
   - Watch real-time mining statistics

### First Mining Session

```bash
# Simple command to start mining
python main.py --start

# With specific parameters
python main.py --start --depth 64 --radius 100 --mode balanced
```

## Configuration

### Configuration File (config.yaml)

```yaml
# Mining Behavior
mining:
  enabled: true
  mode: "balanced"  # aggressive, balanced, efficient
  depth: 64         # Mining depth in blocks
  radius: 100       # Search radius from start position
  max_duration: 3600  # Maximum mining duration in seconds
  
  # Ore Configuration
  target_ores:
    - diamond
    - gold
    - iron
    - copper
    - emerald
  
  blacklist_ores:
    - coal
    - stone
  
  # Mining Patterns
  pattern: "spiral"  # spiral, grid, depth-first, random
  torch_placement: true
  auto_smelt: false

# Safety Settings
safety:
  lava_detection: true
  water_detection: true
  fall_damage_prevention: true
  mob_avoidance: true
  low_health_threshold: 10
  auto_return_home: true
  emergency_stop_enabled: true

# Inventory Management
inventory:
  auto_manage: true
  storage_location: "chest"
  max_pickup_distance: 20
  auto_deposit_interval: 300
  valuable_items_priority: true

# Performance
performance:
  tick_rate: 20
  chunk_preload: true
  use_multithreading: true
  max_threads: 4
  memory_limit: "2G"

# Logging & Monitoring
logging:
  level: "INFO"  # DEBUG, INFO, WARNING, ERROR
  file_output: true
  log_file: "mining.log"
  console_output: true
  
monitoring:
  enabled: true
  web_dashboard: true
  web_port: 5000
  stats_interval: 30  # Update interval in seconds

# Server Configuration
server:
  host: "localhost"
  port: 25565
  username: "auto_miner"
  password: ""
  auth_type: "online"  # online, offline
  dimension: "overworld"  # overworld, nether, end
```

### Environment Variables

```bash
# Set your Minecraft server details
export MC_SERVER_HOST=localhost
export MC_SERVER_PORT=25565
export MC_USERNAME=auto_miner
export MC_PASSWORD=yourpassword
export LOG_LEVEL=INFO
```

## Usage

### Command Line Interface

```bash
# Start mining with default settings
python main.py --start

# Start with custom parameters
python main.py --start \
  --mode aggressive \
  --depth 32 \
  --radius 200 \
  --ores diamond,gold

# List available ores
python main.py --list-ores

# Test connection
python main.py --test-connection

# View current status
python main.py --status

# Stop mining gracefully
python main.py --stop

# Force restart
python main.py --restart

# View logs
python main.py --logs --tail 100

# Debug mode
python main.py --debug --verbose
```

### Web Dashboard

Access the control panel at `http://localhost:5000`

**Dashboard Features:**
- Real-time mining statistics
- Start/Stop controls
- Ore configuration management
- Performance metrics
- Historical data visualization
- Server logs viewer
- Configuration editor

### Python API

```python
from minecraft_auto_miner import AutoMiner

# Initialize miner
miner = AutoMiner(config_file='config.yaml')

# Start mining
miner.start()

# Configure mining
miner.set_target_ores(['diamond', 'gold'])
miner.set_mode('aggressive')

# Monitor progress
stats = miner.get_statistics()
print(f"Blocks mined: {stats['blocks_mined']}")
print(f"Ores found: {stats['ores_found']}")

# Stop mining
miner.stop()
```

## Advanced Features

### Custom Mining Patterns

Define your own mining patterns:

```yaml
custom_patterns:
  tunnel:
    description: "Parallel tunnel mining"
    tunnel_width: 3
    tunnel_spacing: 10
    
  quarry:
    description: "Quarry-style mining"
    size: 100
    layer_height: 5
```

### Multi-Dimensional Mining

```bash
python main.py --start --dimension nether --depth 120 --ores netherite,gold
```

### Coordinated Mining Network

```python
# Multiple miners working together
miners = [
    AutoMiner(zone=(0, 0, 100, 100)),
    AutoMiner(zone=(100, 0, 200, 100)),
    AutoMiner(zone=(0, 100, 100, 200)),
]

for miner in miners:
    miner.start()
```

### Performance Tuning

```bash
# High-performance mode
python main.py --start --performance-profile extreme

# Low-resource mode
python main.py --start --performance-profile minimal
```

## Troubleshooting

### Common Issues

**Issue: Miner gets stuck in one location**
- Solution: Try different mining patterns with `--pattern grid`
- Check pathfinding with `--debug` flag
- Restart miner with `--restart`

**Issue: High memory usage**
- Solution: Reduce `radius` parameter
- Lower `max_threads` in config
- Use `--performance-profile minimal`

**Issue: Connection timeout**
- Solution: Verify server is running
- Check network connectivity with `--test-connection`
- Increase timeout with `--connection-timeout 30`

**Issue: Miner avoids valuable ores**
- Solution: Check `blacklist_ores` configuration
- Verify ore detection with `--list-ores`
- Use `--verbose` flag for diagnostics

### Debug Mode

```bash
# Enable debug logging
python main.py --start --debug --verbose --log-level DEBUG

# Generate diagnostic report
python main.py --diagnose
```

### Logs

```bash
# View recent logs
tail -f mining.log

# View specific error
grep "ERROR" mining.log

# Clear logs (archive old ones)
python main.py --rotate-logs
```

## Performance Tips

1. **Optimize radius**: Smaller radius = faster processing
2. **Choose appropriate depth**: Balance between ore accessibility and speed
3. **Use efficient patterns**: Grid pattern usually fastest for open areas
4. **Enable chunk preloading**: Better performance in unloaded chunks
5. **Monitor resource usage**: Adjust threads if CPU usage is high
6. **Regular maintenance**: Restart mining session every 24 hours

## Contributing

We welcome contributions! Here's how to help:

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/minecraft-auto-miner.git
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes** and test thoroughly

4. **Commit with clear messages**
   ```bash
   git commit -m "Add: descriptive message of changes"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request** with detailed description

### Development Setup

```bash
# Clone and setup development environment
git clone https://github.com/duyanhggg/minecraft-auto-miner.git
cd minecraft-auto-miner
pip install -r requirements-dev.txt

# Run tests
pytest tests/

# Format code
black .

# Run linter
pylint minecraft_auto_miner/
```

### Code Style

- Follow PEP 8 guidelines
- Use type hints for all functions
- Write docstrings for classes and methods
- Add unit tests for new features
- Update documentation accordingly

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues, questions, or suggestions:

- 📋 **GitHub Issues**: [Report bugs](https://github.com/duyanhggg/minecraft-auto-miner/issues)
- 💬 **Discussions**: [Ask questions](https://github.com/duyanhggg/minecraft-auto-miner/discussions)
- 📧 **Email**: [Contact maintainers](mailto:duyanhggg@example.com)
- 🐛 **Bug Reports**: Please include logs and system info

## Changelog

### Version 1.0.0 (Current)
- Initial release
- Basic mining automation
- Web dashboard
- Multiple mining patterns
- Performance optimization tools

## Roadmap

- [ ] Minecraft 1.20+ support
- [ ] Machine learning-based ore detection
- [ ] Mobile app for remote monitoring
- [ ] Multiplayer mining coordination
- [ ] Custom plugin system
- [ ] Advanced pathfinding algorithm

## Disclaimer

This tool is designed for single-player or authorized servers. Please ensure you have permission from server administrators before using automated mining tools on multiplayer servers.

---

**Made with ❤️ by duyanhggg**

⭐ If you find this useful, consider giving it a star!
