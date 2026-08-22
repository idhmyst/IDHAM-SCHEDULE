import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants/theme';
import { ChatMessage } from '../types';

interface ChatBubbleProps {
  message: ChatMessage;
  onQuickReplyPress?: (text: string) => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, onQuickReplyPress }) => {
  const isBot = message.sender === 'bot';

  // Helper to render basic markdown bold **text**
  const renderFormattedText = (rawText: string) => {
    const parts = rawText.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <Text key={index} style={styles.boldText}>
            {part.slice(2, -2)}
          </Text>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <Text key={index} style={styles.italicText}>
            {part.slice(1, -1)}
          </Text>
        );
      }
      return <Text key={index}>{part}</Text>;
    });
  };

  return (
    <View style={[styles.container, isBot ? styles.botContainer : styles.userContainer]}>
      {isBot && (
        <Image
          source={require('../../assets/icon.png')}
          style={styles.botAvatar}
          resizeMode="cover"
        />
      )}

      <View style={[styles.bubble, isBot ? styles.botBubble : styles.userBubble]}>
        <Text style={[styles.messageText, isBot ? styles.botText : styles.userText]}>
          {renderFormattedText(message.text)}
        </Text>
        <Text style={[styles.timestamp, isBot ? styles.botTimestamp : styles.userTimestamp]}>
          {message.timestamp}
        </Text>

        {/* Quick action chips inside bot message */}
        {isBot && message.quickReplies && message.quickReplies.length > 0 && (
          <View style={styles.quickRepliesContainer}>
            {message.quickReplies.map((reply, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.replyChip}
                onPress={() => onQuickReplyPress && onQuickReplyPress(reply)}
                activeOpacity={0.7}
              >
                <Text style={styles.replyChipText}>{reply}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  botContainer: {
    justifyContent: 'flex-start',
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  botBubble: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  botText: {
    color: COLORS.textDark,
  },
  userText: {
    color: COLORS.white,
  },
  boldText: {
    fontWeight: 'bold',
  },
  italicText: {
    fontStyle: 'italic',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  botTimestamp: {
    color: COLORS.textLight,
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  quickRepliesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  replyChip: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primaryBadge,
  },
  replyChipText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
});
