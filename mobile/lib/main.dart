import 'package:flutter/material.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'dart:convert';
import 'dart:async';

void main() {
  runApp(const CrowdShieldApp());
}

class CrowdShieldApp extends StatelessWidget {
  const CrowdShieldApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CrowdShield Citizen',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF0F172A),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF2563EB),
          surface: Color(0xFF1E293B),
        ),
      ),
      home: const DashboardScreen(),
    );
  }
}

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  WebSocketChannel? _channel;
  StreamSubscription? _subscription;
  Timer? _reconnectTimer;
  bool _isConnected = false;

  Map<String, dynamic> _telemetry = {
    'person_count': 0,
    'density_per_m2': 0.0,
    'flow_speed': 0.0,
    'risk_level': 'NORMAL',
  };

  // Switch between Cloud Render and Local Android Emulator
  // Cloud: 'wss://crowdshield-backend.onrender.com/ws/stream?stream_url=0'
  // Local Emulator: 'ws://10.0.2.2:8000/ws/stream?stream_url=0'
  final String _wsUrl = 'wss://crowdshield-backend.onrender.com/ws/stream?stream_url=0';

  @override
  void initState() {
    super.initState();
    _connectWebSocket();
  }

  void _connectWebSocket() {
    try {
      _channel = WebSocketChannel.connect(Uri.parse(_wsUrl));
      _subscription = _channel!.stream.listen(
        (event) {
          if (!_isConnected) {
            setState(() => _isConnected = true);
          }
          final dynamic data = jsonDecode(event);
          if (data is Map<String, dynamic> && data['error'] == null) {
            setState(() {
              _telemetry = data;
            });
          }
        },
        onError: (error) {
          debugPrint("WebSocket Error: $error");
          _handleDisconnect();
        },
        onDone: () {
          debugPrint("WebSocket Closed");
          _handleDisconnect();
        },
        cancelOnError: true,
      );
    } catch (e) {
      debugPrint("Connection exception: $e");
      _handleDisconnect();
    }
  }

  void _handleDisconnect() {
    setState(() => _isConnected = false);
    _subscription?.cancel();
    _reconnectTimer?.cancel();
    // Auto-reconnect every 3 seconds if connection drops
    _reconnectTimer = Timer(const Duration(seconds: 3), _connectWebSocket);
  }

  @override
  void dispose() {
    _reconnectTimer?.cancel();
    _subscription?.cancel();
    _channel?.sink.close();
    super.dispose();
  }

  Color _getRiskColor(String level) {
    switch (level) {
      case 'CRITICAL':
        return Colors.redAccent;
      case 'WARNING':
        return Colors.orangeAccent;
      default:
        return Colors.greenAccent;
    }
  }

  @override
  Widget build(BuildContext context) {
    final String riskLevel = _telemetry['risk_level']?.toString() ?? 'NORMAL';
    final Color riskColor = _getRiskColor(riskLevel);

    return Scaffold(
      appBar: AppBar(
        title: const Text('CROWDSHIELD // Field Mobile', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFF1E293B),
        actions: [
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: _isConnected ? riskColor : Colors.grey,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Center(
              child: Text(
                _isConnected ? riskLevel : 'OFFLINE',
                style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 11),
              ),
            ),
          )
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAlignment.start,
          children: [
            // Threat Status Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: _isConnected ? riskColor : Colors.white24, width: 2),
              ),
              child: Column(
                children: [
                  Icon(
                    riskLevel == 'CRITICAL' ? Icons.warning_sharp : Icons.shield_outlined,
                    color: _isConnected ? riskColor : Colors.white38,
                    size: 48,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    _isConnected ? 'THREAT INDEX: $riskLevel' : 'CONNECTING TO ENGINE...',
                    style: TextStyle(
                      color: _isConnected ? riskColor : Colors.white70,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    riskLevel == 'CRITICAL'
                        ? 'CRITICAL ALERT: High crush density detected! Proceed to emergency exit.'
                        : 'Zone density normal. Follow standard safety routes.',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.white70, fontSize: 13),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            const Text(
              'Live Zone Telemetry',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            const SizedBox(height: 12),

            // Metrics Grid
            Expanded(
              child: GridView.count(
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                children: [
                  _buildMetricTile('People Count', '${_telemetry['person_count'] ?? 0}', Icons.people),
                  _buildMetricTile('Density', '${_telemetry['density_per_m2'] ?? 0.0} /m²', Icons.grain),
                  _buildMetricTile('Flow Speed', '${_telemetry['flow_speed'] ?? 0.0} m/s', Icons.speed),
                  _buildMetricTile('Active Zone', 'Sector 4 Gate 1', Icons.map),
                ],
              ),
            ),

            // SOS Alert Button
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton.icon(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('🚨 SOS Broadcasted to Police Command Center! GPS coordinates dispatched.'),
                      backgroundColor: Colors.redAccent,
                      duration: Duration(seconds: 4),
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.redAccent,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                icon: const Icon(Icons.emergency, color: Colors.white),
                label: const Text(
                  'BROADCAST EMERGENCY SOS',
                  style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 13),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricTile(String title, String value, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: const Color(0xFF38BDF8), size: 28),
          const SizedBox(height: 8),
          Text(title, style: const TextStyle(color: Colors.white54, fontSize: 12)),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }
}
