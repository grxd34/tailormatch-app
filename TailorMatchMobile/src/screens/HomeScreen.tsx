import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

const HomeScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to TailorMatch</Text>
          <Text style={styles.subtitle}>
            {user ? `Hello, ${user.first_name}!` : 'Your Tailoring Companion'}
          </Text>
        </View>

        <View style={styles.actionsContainer}>
          {user?.is_tailor ? (
            // Tailor Dashboard Actions
            <>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>View Requests</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Update Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>View Portfolio</Text>
              </TouchableOpacity>
            </>
          ) : (
            // Customer Dashboard Actions
            <>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/screens/FindTailorsScreen')}
              >
                <Text style={styles.actionButtonText}>Find Tailors</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/screens/CreateRequestScreen')}
              >
                <Text style={styles.actionButtonText}>Create Request</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/screens/MyRequestsScreen')}
              >
                <Text style={styles.actionButtonText}>My Requests</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  actionsContainer: {
    gap: 15,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;
