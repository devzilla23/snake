function SnakeSettings(props) {
  return (
    <Page>
      <Section
        title={<Text bold align="center">Snake Settings</Text>}>
        <Text>Snake color</Text>
        <ColorSelect
          settingsKey="snake_color"
          colors={[
            {color: 'tomato'},
            {color: 'sandybrown'},
            {color: 'gold'},
            {color: 'aquamarine'},
            {color: 'deepskyblue'},
            {color: 'green'},
            {color: 'cyan'},
          ]}
        />
         <Text>Backround color</Text>
        <ColorSelect
          settingsKey="board_color"
          colors={[
            {color: 'tomato'},
            {color: 'sandybrown'},
            {color: 'gold'},
            {color: 'aquamarine'},
            {color: 'deepskyblue'},
            {color: 'green'},
            {color: 'cyan'},
            
          ]}
        />
      </Section>
    </Page>
  );
}

registerSettingsPage(SnakeSettings);
