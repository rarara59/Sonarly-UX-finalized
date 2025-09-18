// src/components/RoundedBarChart.js
import React from 'react';
import { View, StyleSheet } from 'react-native';

const RoundedBarChart = ({ 
  data = [], 
  maxHeight = 60, 
  barWidth = 8, 
  barSpacing = 2, 
  color = '#5CAEFF',
  maxValue = null 
}) => {
  // Calculate max value if not provided
  const calculatedMaxValue = maxValue || Math.max(...data, 1);
  
  return (
    <View style={[styles.container, { height: maxHeight }]}>
      {data.map((value, index) => {
        const heightPercentage = (value / calculatedMaxValue) * 100;
        const barHeight = Math.max((heightPercentage / 100) * maxHeight, 2); // Minimum height of 2
        
        return (
          <View
            key={index}
            style={[
              styles.bar,
              {
                height: barHeight,
                width: barWidth,
                backgroundColor: color,
                marginHorizontal: barSpacing / 2,
                // Round the top only
                borderTopLeftRadius: barWidth / 2,
                borderTopRightRadius: barWidth / 2,
              }
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  bar: {
    backgroundColor: '#5CAEFF',
  },
});

export default RoundedBarChart;