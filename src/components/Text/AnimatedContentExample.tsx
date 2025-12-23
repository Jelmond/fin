"use client";

import React from 'react';
import AnimatedGrid from './AnimatedContent';

const AnimatedContentShowcase = () => {
  return (
    <div style={{ width: '100%' }}>
      <Section bg="#181a20">
        <AnimatedGrid
          type="rows"
          animation={{
            from: { opacity: 0, y: '40px' },
            to: { opacity: 1, y: '0px' },
            delayStep: 40
          }}
          overflow={true}
          containerStyle={{ overflow: 'hidden' }}
          cellConfigs={
            {
              'fade-in-words': {
                animationElement: {
                  from: { x: '-100px', y: '0px' },
                  to: { x: '0px', y: '0px' },
                  delayStep: 40,
                  config: {
                    duration: 1000,
                  }
                },
              },
            }
          }
        >
          <h2  style={{
                  color: 'red',
                  marginBottom: '0.5em',
                  fontSize: '2em',}} id="fade-in-words">Fade-in по словам</h2>
          <br />
          <p>
            <p>dsf</p>
            <span>f</span>
            Эта анимация плавно проявляет каждое слово по очереди. Чем больше текста, тем интереснее выглядит эффект. 
            Можно добавить длинное предложение, чтобы увидеть, как слова переходят на новую строку и продолжают анимироваться.
            Даже если текст очень длинный, все слова будут появляться по очереди, не выходя за пределы контейнера.
          </p>
        </AnimatedGrid>
      </Section>

      <Section bg="#232946">
        <AnimatedGrid
          type="words"
          animation={{
            from: { opacity: 0, y: '60px' },
            to: { opacity: 1, y: '0px' },
            config: {
              duration: 1000,
            },
            delayStep: 100
          }}
          containerStyle={{ overflow: 'hidden' }}
          styleRow={{
            alignItems: 'center',
          }}
        >
          <h2>Fade-in по строкам</h2>
          <img src="/android-icon-72x72.png" alt="random image" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
          <a href="https://www.google.com" style={{ color: 'red', textDecoration: 'none', fontSize: '2em' }}>ссылка</a>
          <p>
            Здесь анимация применяется к каждой строке целиком. Это особенно заметно на длинных абзацах, где строки появляются одна за другой, создавая эффект &quot;ступенек&quot;. 
            Такой подход отлично подходит для презентаций и заголовков, где важна последовательность появления информации.
          </p>
        </AnimatedGrid>
      </Section>

      <Section bg="#1a1a2e">
        <AnimatedGrid
          type="words"
          animation={{
            from: { opacity: 0, scale: 0.7, filter: 'blur(8px)' },
            to: { opacity: 1, scale: 1, filter: 'blur(0px)' },
            delayStep: 60
          }}
          containerStyle={{ overflow: 'hidden' }}
        >
          <h2>Scale + Blur по словам</h2>
          <p>
            Каждый элемент появляется с увеличением и исчезающим блюром. Такой эффект отлично подходит для выделения важных частей текста или создания мягкого появления длинных абзацев.
            Попробуйте уменьшить ширину окна, чтобы увидеть, как слова переносятся и анимируются независимо друг от друга.
          </p>
        </AnimatedGrid>
      </Section>

      <Section bg="#0f3460">
        <AnimatedGrid
          type="rows"
          animation={{
            from: { opacity: 0, scale: 0.5, filter: 'blur(12px)' },
            to: { opacity: 1, scale: 1, filter: 'blur(0px)' },
            delayStep: 250
          }}
          containerStyle={{ overflow: 'hidden' }}
        >
          <h2>Scale + Blur по строкам</h2>
          <p>
            Здесь масштаб и блюр применяются к каждой строке целиком. Такой эффект отлично подходит для плавного появления длинных текстовых блоков, когда строки проявляются одна за другой.
            Даже если строк много, каждая из них будет анимироваться отдельно.
          </p>
        </AnimatedGrid>
      </Section>

      <Section bg="#22223b">
        <AnimatedGrid
          type="words"
          animation={{
            from: { opacity: 0, rotateY: '90deg', scale: 0.8 },
            to: { opacity: 1, rotateY: '0deg', scale: 1 },
            delayStep: 80
          }}
          containerStyle={{ overflow: 'hidden' }}
        >
          <h2>3D Flip по словам</h2>
          <p>
            Каждое слово появляется с 3D-поворотом вокруг оси Y. Эффект особенно заметен на длинных предложениях, когда слова выстраиваются в несколько строк.
            Можно добавить еще больше текста, чтобы продемонстрировать, как работает группировка по строкам.
          </p>
        </AnimatedGrid>
      </Section>

      <Section bg="#0d1117">
        <AnimatedGrid
          type="rows"
          animation={{
            from: { opacity: 0, rotateX: '90deg', perspective: 600 },
            to: { opacity: 1, rotateX: '0deg', perspective: 600 },
            delayStep: 300
          }}
          containerStyle={{ overflow: 'hidden' }}
        >
          <h2>3D Flip по строкам</h2>
          <p>
            Здесь 3D-поворот применяется к каждой строке целиком. Такой эффект отлично подходит для футуристичных интерфейсов и презентаций, где строки появляются с эффектом вращения.
            Чем больше строк, тем интереснее выглядит анимация.
          </p>
        </AnimatedGrid>
      </Section>

      <Section bg="#181a20">
        <AnimatedGrid
          type="words"
          animation={{
            from: { opacity: 0, x: '-100px' },
            to: { opacity: 1, x: '0px' },
            delayStep: 50
          }}
          containerStyle={{ overflow: 'hidden' }}
        >
          <h2>Слайд слева по словам</h2>
          <p>
            Слова плавно выезжают слева направо. Этот эффект хорошо заметен, когда в тексте много слов и они занимают несколько строк.
            Добавьте еще больше текста, чтобы увидеть, как анимация работает для каждой строки.
          </p>
        </AnimatedGrid>
      </Section>

      {/* 8. Slide снизу по строкам */}
      <Section bg="#232946">
        <AnimatedGrid
          type="rows"
          animation={{
            from: { opacity: 0, y: '100px' },
            to: { opacity: 1, y: '0px' },
            delayStep: 180
          }}
          containerStyle={{ overflow: 'hidden' }}
        >
          <h2>Слайд снизу по строкам</h2>
          <p>
            Каждая строка появляется с эффектом выезда снизу. Такой эффект отлично подходит для поочередного появления длинных текстовых блоков.
            Даже если строк очень много, каждая из них будет анимироваться отдельно.
          </p>
        </AnimatedGrid>
      </Section>

      <Section bg="#1a1a2e">
        <AnimatedGrid
          type="words"
          animation={{
            from: { opacity: 0, y: '80px', scale: 0.5 },
            to: { opacity: 1, y: '0px', scale: 1 },
            config: { tension: 400, friction: 8 },
            delayStep: 70
          }}
          overflow={false}
        >
          <h2>Bounce по словам</h2>
          <p>
            Каждый элемент подпрыгивает при появлении. Это создает ощущение динамики и живости текста.
            Добавьте длинное предложение, чтобы увидеть, как слова прыгают по очереди, даже если они переходят на новую строку.
          </p>
        </AnimatedGrid>
      </Section>

      <Section bg="#0f3460">
        <AnimatedGrid
          type="rows"
          animation={{
            from: { opacity: 0, y: '60px', scale: 0.7, filter: 'blur(8px)' },
            to: { opacity: 1, y: '0px', scale: 1, filter: 'blur(0px)' },
            delayStep: 220
          }}
          animationElement={{
            from: { x: '-40px', rotateZ: '-10deg' },
            to: { x: '0px', rotateZ: '0deg' }
          }}
          containerStyle={{ overflow: 'hidden' }}
        >
          <h2>Комбинированная анимация</h2>
          <p>
            Здесь применяется сразу несколько эффектов: строки появляются с масштабом и блюром, а каждое слово внутри строки — слайдится и слегка вращается.
            Такой подход позволяет создавать сложные и интересные анимации для длинных текстов, не выходя за пределы контейнера.
          </p>
        </AnimatedGrid>
      </Section>
    </div>
  );
};

const Section = ({ children, bg }: { children: React.ReactNode, bg: string }) => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: bg,
    color: 'white'
  }}>
    <div style={{ width: '80%', maxWidth: 900 }}>
      {children}
    </div>
  </div>
);

export default AnimatedContentShowcase;