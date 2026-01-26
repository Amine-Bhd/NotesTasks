import React from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity, Alert, Platform } from 'react-native';
import { Hyperlink } from '../types';

interface NoteContentProps {
  content: string;
  hyperlinks?: Hyperlink[];
  onReferenceClick?: (link: Hyperlink) => void;
}

export default function NoteContent({ content, hyperlinks = [], onReferenceClick }: NoteContentProps) {
  // Regex to find patterns like [1], [2], etc.
  const refRegex = /\[(\d+)\]/g;
  
  const parts = content.split(refRegex);
  
  const openLink = async (url: string) => {
    let targetUrl = url;
    if (!/^https?:\/\//i.test(url) && !/^mailto:/i.test(url)) {
      targetUrl = 'https://' + url;
    }
    
    const supported = await Linking.canOpenURL(targetUrl);
    if (supported) {
      await Linking.openURL(targetUrl);
    } else {
      Alert.alert("Error", "Cannot open this URL: " + targetUrl);
    }
  };

  const handleLongPress = (link: Hyperlink) => {
    if (Platform.OS !== 'web') {
      Alert.alert(link.title || "Link", link.url);
    }
  };

  return (
    <Text style={styles.text}>
      {parts.map((part, index) => {
        // Even indices are text, odd indices are captured numbers
        if (index % 2 === 0) {
          return <Text key={index}>{part}</Text>;
        } else {
          const refNum = parseInt(part, 10);
          const link = hyperlinks.find(l => l.referenceNumber === refNum);
          
          if (link) {
            return (
              <Text
                key={index}
                style={styles.link}
                onPress={() => openLink(link.url)}
                onLongPress={() => handleLongPress(link)}
                // @ts-ignore - title prop works on web for hover text
                title={link.url}
              >
                [{part}]
              </Text>
            );
          }
          return <Text key={index}>[{part}]</Text>;
        }
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  link: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
});
