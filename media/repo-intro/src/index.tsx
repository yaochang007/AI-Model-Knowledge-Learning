import React from 'react';
import {AbsoluteFill, Audio, Composition, Img, Sequence, registerRoot, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import data from './video-data.json';
import audioManifest from './audio-manifest.json';

type Language = 'en' | 'zh';
type Aspect = '16x9' | '9x16' | '4x3';

type VideoProps = {
  language: Language;
  aspect: Aspect;
};

const fps = 30;
const videoData = data as any;
const audioData = audioManifest as Record<Language, Record<string, {file: string; duration: number}>>;

const dimensions: Record<Aspect, {width: number; height: number}> = {
  '16x9': {width: 1920, height: 1080},
  '9x16': {width: 1080, height: 1920},
  '4x3': {width: 1600, height: 1200}
};

const variants: Array<{id: string; language: Language; aspect: Aspect}> = [
  {id: 'IntroEN169', language: 'en', aspect: '16x9'},
  {id: 'IntroEN916', language: 'en', aspect: '9x16'},
  {id: 'IntroZH169', language: 'zh', aspect: '16x9'},
  {id: 'IntroZH43', language: 'zh', aspect: '4x3'},
  {id: 'IntroZH916', language: 'zh', aspect: '9x16'}
];

const coverVariants: Array<{id: string; language: Language; aspect: Aspect}> = [
  {id: 'CoverEN169', language: 'en', aspect: '16x9'},
  {id: 'CoverEN43', language: 'en', aspect: '4x3'},
  {id: 'CoverEN916', language: 'en', aspect: '9x16'},
  {id: 'CoverZH169', language: 'zh', aspect: '16x9'},
  {id: 'CoverZH43', language: 'zh', aspect: '4x3'},
  {id: 'CoverZH916', language: 'zh', aspect: '9x16'}
];

const getLanguageConfig = (language: Language) => videoData.languages[language];

const getSceneDuration = (language: Language, sceneId: string) => {
  const audio = audioData[language]?.[sceneId];
  return Math.ceil(((audio?.duration ?? 6) + 0.55) * fps);
};

const getTotalFrames = (language: Language) =>
  getLanguageConfig(language).scenes.reduce((total: number, scene: any) => total + getSceneDuration(language, scene.id), 0) + 12;

const palette = {
  ink: '#172033',
  muted: '#5d6677',
  blue: '#1778c8',
  cyan: '#29a9df',
  violet: '#36358c',
  green: '#0d9488',
  coral: '#e85d3f',
  paper: '#f7fafc',
  white: '#ffffff',
  border: '#d7dde8'
};

const isVertical = (aspect: Aspect) => aspect === '9x16';

const baseText = (language: Language) => ({
  fontFamily: language === 'zh'
    ? '"PingFang SC", "Noto Sans SC", "Hiragino Sans GB", sans-serif'
    : '"Inter", "Aptos", "Helvetica Neue", Arial, sans-serif'
});

const lineHeight = (language: Language) => language === 'zh' ? 1.35 : 1.16;

const scale = (aspect: Aspect, wide: number, vertical: number, square = wide) =>
  aspect === '9x16' ? vertical : aspect === '4x3' ? square : wide;

const LogoLockup: React.FC<{language: Language; aspect: Aspect}> = ({language, aspect}) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: scale(aspect, 18, 14, 16),
    color: palette.ink,
    ...baseText(language)
  }}>
    <Img src={staticFile(videoData.brand.logo)} style={{
      width: scale(aspect, 74, 64, 68),
      height: scale(aspect, 74, 64, 68),
      objectFit: 'contain'
    }} />
    <div>
      <div style={{fontWeight: 900, fontSize: scale(aspect, 30, 25, 28), letterSpacing: 0}}>Vue Tech SG</div>
      <div style={{fontSize: scale(aspect, 17, 15, 16), color: palette.muted}}>AI Research</div>
    </div>
  </div>
);

const StatGrid: React.FC<{aspect: Aspect; language: Language}> = ({aspect, language}) => {
  const labels = language === 'zh'
    ? ['278 篇论文', '27 篇必读', '分析 + 精读']
    : videoData.brand.stats;
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isVertical(aspect) ? '1fr' : 'repeat(3, 1fr)',
      gap: scale(aspect, 18, 18, 16)
    }}>
      {labels.map((label: string, index: number) => (
        <div key={label} style={{
          background: palette.white,
          border: `2px solid ${index === 0 ? palette.blue : index === 1 ? palette.green : palette.coral}`,
          borderRadius: 18,
          padding: scale(aspect, 26, 24, 24),
          boxShadow: '0 18px 42px rgba(23, 32, 51, 0.10)'
        }}>
          <div style={{fontSize: scale(aspect, 44, 38, 40), fontWeight: 950, color: index === 0 ? palette.blue : index === 1 ? palette.green : palette.coral}}>
            {label.split(' ')[0]}
          </div>
          <div style={{fontSize: scale(aspect, 20, 22, 20), color: palette.ink, fontWeight: 800}}>
            {label.replace(label.split(' ')[0], '').trim() || label}
          </div>
        </div>
      ))}
    </div>
  );
};

const BrowserMock: React.FC<{aspect: Aspect; language: Language}> = ({aspect, language}) => (
  <div style={{
    background: palette.white,
    border: `2px solid ${palette.border}`,
    borderRadius: 24,
    overflow: 'hidden',
    boxShadow: '0 24px 60px rgba(23, 32, 51, 0.14)'
  }}>
    <div style={{height: scale(aspect, 58, 54, 56), background: '#eef3f8', display: 'flex', alignItems: 'center', gap: 10, padding: '0 24px'}}>
      <span style={{width: 14, height: 14, borderRadius: 99, background: palette.coral}} />
      <span style={{width: 14, height: 14, borderRadius: 99, background: '#f4b44d'}} />
      <span style={{width: 14, height: 14, borderRadius: 99, background: palette.green}} />
      <div style={{marginLeft: 18, color: palette.muted, fontSize: scale(aspect, 18, 16, 17)}}>{videoData.brand.url}</div>
    </div>
    <div style={{padding: scale(aspect, 34, 30, 30), display: 'grid', gap: 18}}>
      <div style={{fontSize: scale(aspect, 30, 27, 28), fontWeight: 900, color: palette.ink}}>
        {language === 'zh' ? 'Vue Tech SG AI Research' : 'Vue Tech SG AI Research'}
      </div>
      <div style={{display: 'flex', gap: 12, flexWrap: 'wrap'}}>
        {(language === 'zh' ? ['Transformer', 'AI 教育', '精读笔记'] : ['Transformer', 'AI Education', 'Study Notes']).map((item) => (
          <span key={item} style={{padding: '12px 16px', borderRadius: 999, background: '#edf7fb', color: palette.blue, fontWeight: 800, fontSize: scale(aspect, 18, 16, 17)}}>{item}</span>
        ))}
      </div>
      {[0, 1, 2].map((item) => (
        <div key={item} style={{height: scale(aspect, 64, 70, 62), borderRadius: 14, border: `1px solid ${palette.border}`, background: item === 0 ? '#fbfdff' : '#f7fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px'}}>
          <span style={{fontSize: scale(aspect, 19, 18, 18), fontWeight: 800, color: palette.ink}}>{['Attention Is All You Need', 'Kimi Linear', 'LLMs for Education'][item]}</span>
          <span style={{fontSize: scale(aspect, 16, 15, 15), color: palette.green, fontWeight: 900}}>{language === 'zh' ? '可学习' : 'Ready'}</span>
        </div>
      ))}
    </div>
  </div>
);

const PaperCards: React.FC<{aspect: Aspect}> = ({aspect}) => {
  const papers = ['Transformer', 'BERT', 'RAG', 'LoRA', 'Mamba'];
  return (
    <div style={{display: 'grid', gap: scale(aspect, 16, 18, 16), gridTemplateColumns: isVertical(aspect) ? '1fr' : 'repeat(5, 1fr)'}}>
      {papers.map((paper, index) => (
        <div key={paper} style={{
          minHeight: scale(aspect, 190, 130, 170),
          borderRadius: 20,
          padding: scale(aspect, 22, 22, 20),
          background: palette.white,
          border: `2px solid ${[palette.blue, palette.violet, palette.green, palette.coral, palette.cyan][index]}`,
          boxShadow: '0 18px 42px rgba(23, 32, 51, 0.10)'
        }}>
          <div style={{fontSize: scale(aspect, 20, 18, 18), color: palette.muted, fontWeight: 900}}>0{index + 1}</div>
          <div style={{fontSize: scale(aspect, 28, 28, 25), color: palette.ink, fontWeight: 950, marginTop: 18}}>{paper}</div>
        </div>
      ))}
    </div>
  );
};

const AnalysisVisual: React.FC<{aspect: Aspect; language: Language}> = ({aspect, language}) => {
  const items = language === 'zh'
    ? ['背景', '方法', '结果', '局限', '启发']
    : ['Overview', 'Method', 'Results', 'Limits', 'Takeaways'];
  return (
    <div style={{display: 'grid', gridTemplateColumns: isVertical(aspect) ? '1fr' : '1.1fr 0.9fr', gap: 22}}>
      <div style={{background: palette.white, border: `2px solid ${palette.border}`, borderRadius: 24, padding: scale(aspect, 34, 28, 30)}}>
        <div style={{fontSize: scale(aspect, 34, 30, 32), color: palette.ink, fontWeight: 950, marginBottom: 20}}>
          {language === 'zh' ? 'PPT 式分析页面' : 'PPT-style analysis'}
        </div>
        <div style={{display: 'grid', gap: 12}}>
          {items.map((item, index) => (
            <div key={item} style={{display: 'flex', alignItems: 'center', gap: 14, fontSize: scale(aspect, 22, 21, 21), color: palette.ink, fontWeight: 800}}>
              <span style={{width: 34, height: 34, borderRadius: 10, background: index % 2 ? palette.green : palette.blue, color: palette.white, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 16}}>{index + 1}</span>
              {item}
            </div>
          ))}
        </div>
      </div>
      <div style={{background: '#172033', borderRadius: 24, padding: scale(aspect, 30, 28, 28), color: palette.white}}>
        <div style={{fontSize: scale(aspect, 24, 22, 22), fontWeight: 900, color: '#85d7f5'}}>{language === 'zh' ? '一页一个重点' : 'One idea per slide'}</div>
        <div style={{fontSize: scale(aspect, 44, 40, 40), lineHeight: 1.05, fontWeight: 950, marginTop: 24, whiteSpace: 'pre-line'}}>
          {language === 'zh' ? '快读\n不浅读' : 'Fast\nnot shallow'}
        </div>
      </div>
    </div>
  );
};

const ReadingVisual: React.FC<{aspect: Aspect; language: Language}> = ({aspect, language}) => (
  <div style={{display: 'grid', gridTemplateColumns: isVertical(aspect) ? '1fr' : '0.9fr 1.1fr', gap: 22, alignItems: 'stretch'}}>
    <div style={{background: palette.white, borderRadius: 24, border: `2px solid ${palette.border}`, padding: 14, overflow: 'hidden'}}>
      <Img src={staticFile('figures/attention-is-all-you-need-fig1-transformer-architecture.png')} style={{width: '100%', height: scale(aspect, 360, 420, 330), objectFit: 'contain', background: palette.white}} />
    </div>
    <div style={{display: 'grid', gap: 14}}>
      {(language === 'zh' ? ['学习准备', '核心概念', '详细批注', '练习任务'] : ['Study setup', 'Core concepts', 'Detailed comments', 'Practice tasks']).map((item, index) => (
        <div key={item} style={{background: palette.white, border: `2px solid ${index === 1 ? palette.green : palette.border}`, borderRadius: 18, padding: scale(aspect, 22, 21, 20), fontSize: scale(aspect, 23, 23, 21), fontWeight: 900, color: palette.ink}}>
          {item}
        </div>
      ))}
    </div>
  </div>
);

const CTAVisual: React.FC<{aspect: Aspect; language: Language}> = ({aspect, language}) => {
  const items = language === 'zh' ? ['搜索', '筛选', '下载', '精读'] : ['Search', 'Filter', 'Download', 'Study'];
  return (
    <div style={{background: palette.white, borderRadius: 28, border: `2px solid ${palette.border}`, padding: scale(aspect, 38, 30, 34), boxShadow: '0 24px 60px rgba(23, 32, 51, 0.12)'}}>
      <div style={{display: 'grid', gridTemplateColumns: isVertical(aspect) ? '1fr' : 'repeat(4, 1fr)', gap: 16}}>
        {items.map((item, index) => (
          <div key={item} style={{borderRadius: 18, padding: scale(aspect, 24, 22, 22), color: palette.white, background: [palette.blue, palette.green, palette.coral, palette.violet][index], fontSize: scale(aspect, 28, 27, 26), fontWeight: 950, textAlign: 'center'}}>
            {item}
          </div>
        ))}
      </div>
      <div style={{marginTop: scale(aspect, 34, 30, 30), fontSize: scale(aspect, 42, 40, 38), color: palette.ink, fontWeight: 950, textAlign: 'center'}}>
        research.vue.sg
      </div>
    </div>
  );
};

const SceneVisual: React.FC<{visual: string; aspect: Aspect; language: Language}> = ({visual, aspect, language}) => {
  if (visual === 'stats') return <StatGrid aspect={aspect} language={language} />;
  if (visual === 'browser') return <BrowserMock aspect={aspect} language={language} />;
  if (visual === 'papers') return <PaperCards aspect={aspect} />;
  if (visual === 'analysis') return <AnalysisVisual aspect={aspect} language={language} />;
  if (visual === 'reading') return <ReadingVisual aspect={aspect} language={language} />;
  return <CTAVisual aspect={aspect} language={language} />;
};

const SceneFrame: React.FC<{
  scene: any;
  index: number;
  language: Language;
  aspect: Aspect;
  localFrame: number;
}> = ({scene, index, language, aspect, localFrame}) => {
  const {width, height} = useVideoConfig();
  const intro = spring({frame: localFrame, fps, config: {damping: 18}});
  const vertical = isVertical(aspect);
  const safeX = scale(aspect, 118, 72, 92);
  const safeTop = scale(aspect, 76, 72, 76);
  const subtitleHeight = scale(aspect, 170, 270, 180);
  const contentBottom = height - subtitleHeight - scale(aspect, 34, 42, 36);

  return (
    <AbsoluteFill style={{background: palette.paper, ...baseText(language), overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #f8fbff 0%, #edf7fb 46%, #f9f7ff 100%)'}} />
      <div style={{position: 'absolute', right: -width * 0.08, top: -height * 0.14, width: width * 0.34, height: height * 0.34, borderRadius: 40, background: '#d8f1fa', transform: 'rotate(18deg)'}} />
      <div style={{position: 'absolute', left: -width * 0.08, bottom: height * 0.12, width: width * 0.28, height: height * 0.18, borderRadius: 28, background: '#efeefa', transform: 'rotate(-10deg)'}} />
      <div style={{position: 'absolute', left: safeX, right: safeX, top: safeTop, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <LogoLockup language={language} aspect={aspect} />
        <div style={{fontSize: scale(aspect, 18, 16, 17), color: palette.muted, fontWeight: 800}}>0{index + 1} / 06</div>
      </div>

      <div style={{
        position: 'absolute',
        left: safeX,
        right: safeX,
        top: safeTop + scale(aspect, 120, 118, 110),
        bottom: height - contentBottom,
        display: 'grid',
        gridTemplateColumns: vertical ? '1fr' : '0.82fr 1.18fr',
        gap: scale(aspect, 42, 30, 36),
        alignItems: 'center',
        opacity: intro,
        transform: `translateY(${(1 - intro) * 28}px)`
      }}>
        <div>
          <div style={{fontSize: scale(aspect, 20, 22, 19), color: palette.blue, fontWeight: 950, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 18}}>
            {scene.eyebrow}
          </div>
          <div style={{fontSize: scale(aspect, 72, 72, 60), lineHeight: lineHeight(language), color: palette.ink, fontWeight: 950, letterSpacing: 0}}>
            {scene.title}
          </div>
          <div style={{fontSize: scale(aspect, 28, 31, 26), lineHeight: language === 'zh' ? 1.55 : 1.35, color: palette.muted, fontWeight: 650, marginTop: scale(aspect, 28, 26, 24)}}>
            {scene.body}
          </div>
        </div>
        <SceneVisual visual={scene.visual} aspect={aspect} language={language} />
      </div>

      <div style={{
        position: 'absolute',
        left: safeX,
        right: safeX,
        bottom: scale(aspect, 42, 54, 42),
        minHeight: subtitleHeight - scale(aspect, 48, 70, 54),
        borderRadius: 24,
        background: 'rgba(255,255,255,0.90)',
        border: `2px solid ${palette.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: scale(aspect, 28, 30, 28),
        boxShadow: '0 18px 40px rgba(23,32,51,0.08)'
      }}>
        <div style={{fontSize: scale(aspect, 31, 34, 29), lineHeight: language === 'zh' ? 1.42 : 1.3, color: palette.ink, fontWeight: 850, textAlign: 'center'}}>
          {scene.subtitle}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const SceneSequence: React.FC<{
  scene: any;
  index: number;
  language: Language;
  aspect: Aspect;
  from: number;
  duration: number;
}> = ({scene, index, language, aspect, from, duration}) => {
  const frame = useCurrentFrame();
  const audio = audioData[language]?.[scene.id];

  return (
    <Sequence from={from} durationInFrames={duration}>
      <SceneFrame scene={scene} index={index} language={language} aspect={aspect} localFrame={frame - from} />
      {audio?.file ? <Audio src={staticFile(audio.file)} /> : null}
    </Sequence>
  );
};

const RepoIntroVideo: React.FC<VideoProps> = ({language, aspect}) => {
  const scenes = getLanguageConfig(language).scenes;
  let cursor = 0;

  return (
    <AbsoluteFill>
      {scenes.map((scene: any, index: number) => {
        const duration = getSceneDuration(language, scene.id);
        const from = cursor;
        cursor += duration;
        return (
          <SceneSequence
            key={scene.id}
            scene={scene}
            index={index}
            language={language}
            aspect={aspect}
            from={from}
            duration={duration}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const Cover: React.FC<VideoProps> = ({language, aspect}) => {
  const config = getLanguageConfig(language);
  const vertical = isVertical(aspect);
  const safe = scale(aspect, 118, 76, 96);
  return (
    <AbsoluteFill style={{background: 'linear-gradient(135deg, #f7fbff 0%, #edf7fb 42%, #f8f4ff 100%)', ...baseText(language), overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: safe, display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: scale(aspect, 54, 54, 44)}}>
        <LogoLockup language={language} aspect={aspect} />
        <div style={{display: 'grid', gridTemplateColumns: vertical ? '1fr' : '1fr 0.84fr', gap: scale(aspect, 48, 36, 38), alignItems: 'center'}}>
          <div>
            <div style={{display: 'inline-flex', padding: '12px 18px', borderRadius: 999, background: palette.ink, color: palette.white, fontSize: scale(aspect, 22, 22, 20), fontWeight: 900, marginBottom: 30}}>
              {config.coverKicker}
            </div>
            <div style={{fontSize: scale(aspect, 96, 88, 76), lineHeight: lineHeight(language), color: palette.ink, fontWeight: 950, letterSpacing: 0}}>
              {config.title}
            </div>
            <div style={{fontSize: scale(aspect, 34, 36, 30), lineHeight: language === 'zh' ? 1.45 : 1.3, color: palette.muted, fontWeight: 750, marginTop: 28}}>
              {config.coverLine}
            </div>
          </div>
          <div style={{display: 'grid', gap: 18}}>
            <StatGrid aspect={vertical ? '9x16' : '4x3'} language={language} />
          </div>
        </div>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, flexWrap: 'wrap'}}>
          <div style={{fontSize: scale(aspect, 31, 34, 28), color: palette.blue, fontWeight: 950}}>{config.cta}</div>
          <div style={{fontSize: scale(aspect, 20, 20, 18), color: palette.muted, fontWeight: 800}}>
            {language === 'zh' ? '#AI研究 #论文精读 #VueTechSG' : '#AIResearch #PaperReading #VueTechSG'}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => (
  <>
    {variants.map((variant) => (
      <Composition
        key={variant.id}
        id={variant.id}
        component={RepoIntroVideo}
        width={dimensions[variant.aspect].width}
        height={dimensions[variant.aspect].height}
        fps={fps}
        durationInFrames={getTotalFrames(variant.language)}
        defaultProps={{language: variant.language, aspect: variant.aspect}}
      />
    ))}
    {coverVariants.map((variant) => (
      <Composition
        key={variant.id}
        id={variant.id}
        component={Cover}
        width={dimensions[variant.aspect].width}
        height={dimensions[variant.aspect].height}
        fps={fps}
        durationInFrames={1}
        defaultProps={{language: variant.language, aspect: variant.aspect}}
      />
    ))}
  </>
);

registerRoot(RemotionRoot);
