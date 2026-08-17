import 'package:flutter/material.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'dart:convert';

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
  late WebSocketChannel _channel;
  Map<String, dynamic> _telemetry = {
    'person_count': 0,
    'density_per_m2': 0.0,
    'flow_speed': 0.0,
    'risk_level': 'NORMAL',
  };

  @override
  void initState() {
    super.initState();
    // Connect to local backend engine WS
    _channel = WebSocketChannel.connect(
      Uri.parse('ws://10.0.2.2:8000/ws/stream?stream_url=0'),
    );

    _channel.stream.listen((event) {
      setState(() {
        _telemetry = jsonDecode(event);
      });
    }, onError: (error) {
      debugPrint("WS Error: $error");
    });
  }

  @override
  void dispose() {
    _channel.sink.close();
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
    final String riskLevel = _telemetry['risk_level'] ?? 'NORMAL';
    final Color riskColor = _getRiskColor(riskLevel);

    return Scaffold(
      appBar: AppBar(
        title: const Text('CROWDSHIELD // Field Mobile'),
        backgroundColor: const Color(0xFF1E293B),
        actions: [
          Container(
            margin: const EdgeInsets.all(12),
            padding: const EdgeInsets.horizontal(8, 4),
            decoration: BoxDecoration(
              color: riskColor,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Center(
              child: Text(
                riskLevel,
                style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 12),
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
                border: Border.all(color: riskColor, width: 2),
              ),
              child: Column(
                children: [
                  Icon(
                    riskLevel == 'CRITICAL' ? Icons.warning_sharp : Icons.shield_outlined,
                    color: riskColor,
                    size: 48,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'THREAT INDEX: $riskLevel',
                    style: TextStyle(color: riskColor, fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    riskLevel == 'CRITICAL'
                        ? 'CRITICAL ALERT: Proceed to designated emergency exit!'
                        : 'Zone density normal. Follow standard safety routes.',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.white70, fontSize: 14),
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
                  _buildMetricTile('People Count', '${_telemetry['person_count']}', Icons.people),
                  _buildMetricTile('Density', '${_telemetry['density_per_m2']} /m²', Icons.grain),
                  _buildMetricTile('Flow Speed', '${_telemetry['flow_speed']} m/s', Icons.speed),
                  _buildMetricTile('Active Zone', 'Zone A Gate 1', Icons.map),
                ],
              ),
            ),

            // SOS Alert Button
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton.icon(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('SOS Signal Broadcasted to Command Center!'),
                      backgroundColor: Colors.red,
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.redAccent,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                icon: const Icon(Icons.emergency, color: Colors.white),
                label: const Text('BROADCAST EMERGENCY SOS', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
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
          Text(value, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}