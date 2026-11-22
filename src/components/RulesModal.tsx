import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { WOODEN_THEME } from '../theme/woodenTheme';

interface RulesModalProps {
  visible: boolean;
  onClose: () => void;
}

const RULES_ITEMS = [
  {
    title: '1. Deploying from the Yard',
    body: 'Roll a 6 on the ivory die to move a wooden pawn out of your corner Yard onto your colored Start square.',
  },
  {
    title: '2. Clockwise Journey & Home Column',
    body: 'Pawns travel clockwise around the 52-square outer track before turning into your private 5-square colored Home Column.',
  },
  {
    title: '3. Safe Squares (★ & Colored Starts)',
    body: 'The 4 brass Star squares and all 4 colored Start squares are sanctuaries — no pawn can be captured while resting on them.',
  },
  {
    title: '4. Capturing & Bonus Rolls',
    body: 'Landing on an unprotected opponent pawn sends it back to its Yard! You earn an extra roll for rolling a 6, capturing an opponent, or reaching the center Home Goal.',
  },
  {
    title: '5. Triple-Six Rule',
    body: 'Rolling three consecutive 6s in a single turn forfeits that roll and passes the die clockwise.',
  },
  {
    title: '6. Exact Roll to Finish',
    body: 'An exact die count is required to enter the central Home Triangle. Bring all 4 of your pawns Home first to win!',
  },
];

export const RulesModal: React.FC<RulesModalProps> = ({ visible, onClose }) => {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.parchmentSheet}>
          <Text style={styles.title}>CLASSIC LUDO RULES</Text>
          <View style={styles.divider} />
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {RULES_ITEMS.map((item) => (
              <View key={item.title} style={styles.ruleBlock}>
                <Text style={styles.ruleHeading}>{item.title}</Text>
                <Text style={styles.ruleBody}>{item.body}</Text>
              </View>
            ))}
          </ScrollView>

          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>Got It</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(12, 6, 2, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  parchmentSheet: {
    width: '100%',
    maxWidth: 430,
    maxHeight: '84%',
    backgroundColor: WOODEN_THEME.parchmentBg,
    borderRadius: 18,
    padding: 20,
    borderWidth: 3,
    borderColor: WOODEN_THEME.frameMid,
  },
  title: {
    color: WOODEN_THEME.inkDark,
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 1.1,
    textAlign: 'center',
  },
  divider: {
    height: 1.5,
    backgroundColor: WOODEN_THEME.brassGold,
    marginVertical: 12,
  },
  scroll: {
    marginBottom: 14,
  },
  ruleBlock: {
    marginBottom: 12,
  },
  ruleHeading: {
    color: WOODEN_THEME.inkDark,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 3,
  },
  ruleBody: {
    color: WOODEN_THEME.inkMuted,
    fontSize: 13,
    lineHeight: 18.5,
  },
  closeBtn: {
    backgroundColor: WOODEN_THEME.frameMid,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: WOODEN_THEME.brassGold,
  },
  closeBtnText: {
    color: WOODEN_THEME.brassLight,
    fontSize: 14,
    fontWeight: '800',
  },
});
