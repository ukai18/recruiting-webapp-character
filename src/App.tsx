import { useState, useEffect } from 'react';
import './App.css';
import { ATTRIBUTE_LIST, CLASS_LIST, SKILL_LIST } from './consts';


function App() {

  const [attributes, setAttributes] = useState(
    Object.fromEntries(ATTRIBUTE_LIST.map(attr => [attr, 10]))
  );
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  const [skills, setSkills] = useState(
    Object.fromEntries(SKILL_LIST.map(skill => [skill.name, 0]))
  );

  useEffect(() => {
    const fetchCharacter = async () => {
      try {
        const response = await fetch(
          'https://recruiting.verylongdomaintotestwith.ca/api/{ukai18}/character'
        );
        const data = await response.json();
  
        if (data && data.body && data.body.attributes && data.body.skills) {
          setAttributes(data.body.attributes);
          setSkills(data.body.skills);
        } else {
          setAttributes(
            Object.fromEntries(ATTRIBUTE_LIST.map((attr) => [attr, 10]))
          );
          setSkills(
            Object.fromEntries(SKILL_LIST.map((skill) => [skill.name, 0]))
          );
        }
      } catch (error) {
  
        setAttributes(
          Object.fromEntries(ATTRIBUTE_LIST.map((attr) => [attr, 10]))
        );
        setSkills(
          Object.fromEntries(SKILL_LIST.map((skill) => [skill.name, 0]))
        );
      }
    };
  
    fetchCharacter();
  }, []);
  

  const handleAttributeChange = (attrib: string, skillPoint: number) => {
    const totalAttributes = Object.values(attributes).reduce((a, b) => a + b, 0);

    // 7 - limiting the max attributes to 70
    if (totalAttributes + skillPoint> 70) return;

    setAttributes(prev => ({
      ...prev,
      [attrib]: Math.max(0, prev[attrib] + skillPoint)
    }));

  };
  const [skillCheck, setSkillCheck] = useState({
    selectedSkill: SKILL_LIST[0].name,  
    dc: 10,    
    lastRoll: null as number | null,  
    success: null as boolean | null    
  });

  const performSkillCheck = () => {
    const roll = Math.floor(Math.random() * 20) + 1; 
    const skill = SKILL_LIST.find(s => s.name === skillCheck.selectedSkill)!;
    const modifier = calculateModifier(attributes[skill.attributeModifier]);
    const skillTotal = skills[skillCheck.selectedSkill] + modifier;
    const total = roll + skillTotal;
    
    setSkillCheck(prev => ({
      ...prev,
      lastRoll: roll,
      success: total >= prev.dc
    }));
  };

  const calculateModifier = (value: number) => {
    return Math.floor((value - 10) / 2);
  };

  const calculateAvailableSkillPoints = () => {
    const intModifier = calculateModifier(attributes.Intelligence);
    return 10 + (4 * intModifier);
  };
  const calculateSpentSkillPoints = () => {
    return Object.values(skills).reduce((sum, points) => sum + points, 0);
  };
  const handleSkillChange = (skillName: string, delta: number) => {
    const availablePoints = calculateAvailableSkillPoints();
    const spentPoints = calculateSpentSkillPoints();
    
    // no overspending skill points
    if (delta > 0 && spentPoints >= availablePoints) return;
    // no negative skill points
    const newValue = skills[skillName] + delta;
    if (newValue < 0) return;

    setSkills(prev => ({
      ...prev,
      [skillName]: newValue
    }));
  };




const saveCharacter = async () => {
    try {
      const response = await fetch(
        'https://recruiting.verylongdomaintotestwith.ca/api/{ukai18}/character',  
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            attributes,
            skills,
          }),
        }
      );
      if (!response.ok) {
        throw new Error('Failed to save character');
      }
      alert('Character saved successfully!');
    } catch (error) {
      console.error('Error saving character:', error);
      alert('Failed to save character');
    }
};

  // class display part
  const meetsClassRequirements = (className: string) => {
    const requirements = CLASS_LIST[className as keyof typeof CLASS_LIST];
    return Object.entries(requirements).every(([attr, min]) => 
      attributes[attr] >= min
    );
  };

  return (
    <div>
      <div>
        <h2>Skill Check</h2>
        <div>
          <select
            value={skillCheck.selectedSkill}
            onChange={(e) => setSkillCheck(prev => ({
              ...prev,
              selectedSkill: e.target.value
            }))}
          >
            {SKILL_LIST.map(skill => (
              <option key={skill.name} value={skill.name}>
                {skill.name}
              </option>
            ))}
          </select>
            DC: 
          <input
            type="number"
            value={skillCheck.dc}
            onChange={(e) => setSkillCheck(prev => ({
              ...prev,
              dc: parseInt(e.target.value) || 0
            }))}
            placeholder="DC"
          />

          <button onClick={performSkillCheck}>Roll</button>

          {skillCheck.lastRoll !== null && (
            <div>
              Roll: {skillCheck.lastRoll}
              <br />
              {skillCheck.success ? 'Result: Successful' : 'Result: Fail'}
            </div>
          )}
        </div>
      </div>
      <h2>Attributes</h2>
      {ATTRIBUTE_LIST.map(attr => (
        <div key={attr}>
          
          {attr}: {attributes[attr]} 
          (Modifier: {calculateModifier(attributes[attr])})
          <button onClick={() => handleAttributeChange(attr, 1)}>+</button>
          <button onClick={() => handleAttributeChange(attr, -1)}>-</button>
        </div>
      ))}

      <div style={{ display: 'flex', gap: '20px' }}>
        <div>
        <h2>Classes</h2>
          {Object.keys(CLASS_LIST).map(className => (
            <div 
              key={className}
              onClick={() => setSelectedClass(className)}
              style={{ 
                cursor: 'pointer',
                // like the Loom video, meeting requirements turn the text red.
                color: meetsClassRequirements(className) ? 'red' : 'black'
              }}
            >
              {className}
            </div>
          ))}

        </div>
        {/* After clicking on the class, the description will be displayed: */}
        {selectedClass && (
          
          <div>
            
            <h3>{selectedClass} Minimum Requirements:</h3>
            
            {Object.entries(CLASS_LIST[selectedClass as keyof typeof CLASS_LIST])
              .map(([attr, min]) => (
                <div key={attr}>{attr}: {min}</div>
              ))}
              <button onClick={() => setSelectedClass(null)}>Close Requirements View</button>
          </div>

          
        )}
      </div>

      <div>
        <h2>Skills</h2>
        <div>Total skill points available:  {calculateAvailableSkillPoints() - calculateSpentSkillPoints()}</div>
        <br ></br>
        {SKILL_LIST.map(skill => (
          <div key={skill.name}>
            {skill.name}: points: {skills[skill.name]}
            (Modifier: {skill.attributeModifier}): {calculateModifier(attributes[skill.attributeModifier] )} 
            &nbsp;
            <button onClick={() => handleSkillChange(skill.name, 1)}>+</button>
            <button onClick={() => handleSkillChange(skill.name, -1)}>-</button>

            &nbsp;total: {skills[skill.name] + calculateModifier(attributes[skill.attributeModifier])}
          </div>
        ))}
      </div>
      {/* Save button */}
      <button onClick={saveCharacter}>Save Character</button>
    </div>
  );
}

export default App;
