/**
 * Copyright (c) Streamlit Inc. (2018-2022) Snowflake Inc. (2022)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { ReactElement } from "react"
import ReactMarkdown from "react-markdown"
import { mount, render } from "src/lib/test_util"
import IsSidebarContext from "src/components/core/Sidebar/IsSidebarContext"
import { Heading as HeadingProto } from "src/autogen/proto"
import { colors } from "src/theme/primitives/colors"
import StreamlitMarkdown, {
  LinkWithTargetBlank,
  createAnchorFromText,
  HeadingWithAnchor,
  Heading,
  HeadingProtoProps,
  CustomCodeTag,
  CustomCodeTagProps,
} from "./StreamlitMarkdown"

import {
  InlineTooltipIcon,
  StyledLabelHelpWrapper,
} from "src/components/shared/TooltipIcon"

import { StyledLinkIconContainer } from "./styled-components"

// Fixture Generator
const getMarkdownElement = (body: string): ReactElement => {
  const components = {
    a: LinkWithTargetBlank,
  }
  return <ReactMarkdown components={components}>{body}</ReactMarkdown>
}

describe("createAnchorFromText", () => {
  it("generates slugs correctly", () => {
    const cases = [
      ["some header", "some-header"],
      ["some -24$35-9824  header", "some-24-35-9824-header"],
      ["blah___blah___blah", "blah-blah-blah"],
    ]

    cases.forEach(([s, want]) => {
      expect(createAnchorFromText(s)).toEqual(want)
    })
  })
})

describe("linkReference", () => {
  it("renders a link with _blank target", () => {
    const body = "Some random URL like [Streamlit](https://streamlit.io/)"
    const wrapper = mount(getMarkdownElement(body))
    expect(wrapper.find("a").prop("href")).toEqual("https://streamlit.io/")
    expect(wrapper.find("a").prop("target")).toEqual("_blank")
  })

  it("renders a link without title", () => {
    const body =
      "Everybody loves [The Internet Archive](https://archive.org/)."
    const wrapper = mount(getMarkdownElement(body))

    expect(wrapper.find("a").prop("href")).toEqual("https://archive.org/")
    expect(wrapper.find("a").prop("title")).toBeUndefined()
  })

  it("renders a link containing a title", () => {
    const body =
      "My favorite search engine is " +
      '[Duck Duck Go](https://duckduckgo.com/ "The best search engine for privacy").'
    const wrapper = mount(getMarkdownElement(body))

    expect(wrapper.find("a").prop("href")).toEqual("https://duckduckgo.com/")
    expect(wrapper.find("a").prop("title")).toBe(
      "The best search engine for privacy"
    )
  })

  it("renders a link containing parentheses", () => {
    const body =
      "Here's a link containing parentheses [Yikes](http://msdn.microsoft.com/en-us/library/aa752574(VS.85).aspx)"
    const wrapper = mount(getMarkdownElement(body))

    expect(wrapper.find("a").prop("href")).toEqual(
      "http://msdn.microsoft.com/en-us/library/aa752574(VS.85).aspx"
    )
  })

  it("does not render a link if only [text] and no (href)", () => {
    const body = "Don't convert to a link if only [text] and missing (href)"
    const wrapper = mount(getMarkdownElement(body))

    expect(wrapper.text()).toEqual(
      "Don't convert to a link if only [text] and missing (href)"
    )
    expect(wrapper.find("a").exists()).toBe(false)
  })
})

describe("StreamlitMarkdown", () => {
  it("renders header anchors when isSidebar is false", () => {
    const source = "# header"
    const wrapper = mount(
      <IsSidebarContext.Provider value={false}>
        <StreamlitMarkdown source={source} allowHTML={false} />
      </IsSidebarContext.Provider>
    )
    expect(wrapper.find(StyledLinkIconContainer).exists()).toBeTruthy()
  })

  it("passes props properly", () => {
    const source =
      "<a class='nav_item' href='//0.0.0.0:8501/?p=some_page' target='_self'>Some Page</a>"
    const wrapper = mount(
      <StreamlitMarkdown source={source} allowHTML={true} />
    )

    expect(wrapper.find("a").prop("href")).toEqual(
      "//0.0.0.0:8501/?p=some_page"
    )
    expect(wrapper.find("a").prop("target")).toEqual("_self")
  })

  it("doesn't render header anchors when isSidebar is true", () => {
    const source = "# header"
    const wrapper = mount(
      <IsSidebarContext.Provider value={true}>
        <StreamlitMarkdown source={source} allowHTML={false} />
      </IsSidebarContext.Provider>
    )
    expect(wrapper.find(StyledLinkIconContainer).exists()).toBeFalsy()
  })

  it("propagates header attributes to custom header", () => {
    const source = '<h1 data-test="lol">alsdkjhflaf</h1>'
    const wrapper = mount(<StreamlitMarkdown source={source} allowHTML />)
    expect(
      wrapper.find(HeadingWithAnchor).find("h1").prop("data-test")
    ).toEqual("lol")
  })

  it("displays captions correctly", () => {
    const source = "hello this is a caption"
    const wrapper = mount(
      <StreamlitMarkdown allowHTML={false} source={source} isCaption />
    )
    expect(wrapper.find("StyledStreamlitMarkdown").text()).toEqual(
      "hello this is a caption"
    )
  })

  it("doesn't render invalid markdown (tables, images, etc.) when isLabel is true", () => {
    // Invalid Markdown in widget/expander/tab labels
    const table =
      "<table><tr><th>Month</th><th>Savings</th></tr><tr><td>January</td><td>$100</td></tr></table>"
    const image =
      "![Corgi](https://dictionary.cambridge.org/us/dictionary/english/corgi)"
    // Valid Markdown in widget/expander/tab labels
    const valid =
      "*Italics* ~Strikethrough~ **Bold** :traffic_light: `code` [Yikes](http://msdn.microsoft.com/en-us/library/aa752574(VS.85).aspx)"

    const wrapper1 = mount(
      <StreamlitMarkdown source={table} allowHTML={true} isLabel />
    )
    expect(wrapper1.find("StyledStreamlitMarkdown").text()).toEqual("")
    expect(wrapper1.props().isLabel).toEqual(true)

    const wrapper2 = mount(
      <StreamlitMarkdown source={image} allowHTML={false} isLabel />
    )
    expect(wrapper2.find("StyledStreamlitMarkdown").text()).toEqual("")
    expect(wrapper2.props().isLabel).toEqual(true)

    const wrapper3 = mount(
      <StreamlitMarkdown source={valid} allowHTML={false} isLabel />
    )
    expect(wrapper3.find("StyledStreamlitMarkdown").text()).toEqual(
      "Italics Strikethrough Bold 🚥 code Yikes"
    )
    expect(wrapper3.props().isLabel).toEqual(true)
  })

  it("doesn't render invalid markdown (tables/images/links/code etc.) when isButton is true", () => {
    // Invalid Markdown in button/download button labels
    const link =
      "[Yikes](http://msdn.microsoft.com/en-us/library/aa752574(VS.85).aspx)"
    const code = "`code`"
    // Valid Markdown in button/download button labels
    const text = "*Italics* ~Strikethrough~ **Bold** :traffic_light:"

    const wrapper1 = mount(
      <StreamlitMarkdown source={link} allowHTML={false} isButton />
    )
    expect(wrapper1.find("StyledStreamlitMarkdown").text()).toEqual("")
    expect(wrapper1.props().isButton).toEqual(true)

    const wrapper2 = mount(
      <StreamlitMarkdown source={code} allowHTML={false} isButton />
    )
    expect(wrapper2.find("StyledStreamlitMarkdown").text()).toEqual("")
    expect(wrapper2.props().isButton).toEqual(true)

    const wrapper3 = mount(
      <StreamlitMarkdown source={text} allowHTML={false} isButton />
    )
    expect(wrapper3.find("StyledStreamlitMarkdown").text()).toEqual(
      "Italics Strikethrough Bold 🚥"
    )
    expect(wrapper3.props().isButton).toEqual(true)
  })

  it("colours text properly", () => {
    const colorMapping = new Map(
      Object.entries({
        red: colors.red90,
        blue: colors.blue80,
        green: colors.green90,
        violet: colors.purple80,
        orange: colors.orange100,
      })
    )
    for (const color of Object.keys(colorMapping)) {
      const source = `:${color}[text]`
      const wrapper = mount(
        <StreamlitMarkdown source={source} allowHTML={false} />
      )
      expect(wrapper.find("span").prop("style")?.color).toEqual(
        colorMapping.get(color)
      )
    }
  })
})

const getHeadingProps = (
  elementProps: Partial<HeadingProto> = {}
): HeadingProtoProps => ({
  width: 5,
  element: HeadingProto.create({
    anchor: "some-anchor",
    tag: "h1",
    body: `hello world
          this is a new line`,
    ...elementProps,
  }),
})

describe("Heading", () => {
  it("renders properly after a new line", () => {
    const props = getHeadingProps()
    const wrapper = mount(<Heading {...props} />)
    expect(wrapper.find("h1").text()).toEqual("hello world")
    expect(wrapper.find("RenderedMarkdown").at(1).text()).toEqual(
      "this is a new line"
    )
  })

  it("renders properly without a new line", () => {
    const props = getHeadingProps({ body: "hello" })
    const wrapper = mount(<Heading {...props} />)
    expect(wrapper.find("h1").text()).toEqual("hello")
    expect(wrapper.find("StyledStreamlitMarkdown")).toHaveLength(1)
  })

  it("renders properly with help text", () => {
    const props = getHeadingProps({ body: "hello", help: "help text" })
    const wrapper = mount(<Heading {...props} />)
    expect(wrapper.find("h1").text()).toEqual("hello")
    expect(wrapper.find("StyledStreamlitMarkdown")).toHaveLength(1)
    expect(wrapper.find(StyledLabelHelpWrapper).exists()).toBe(true)
    const inlineTooltipIcon = wrapper.find(InlineTooltipIcon)
    expect(inlineTooltipIcon.exists()).toBe(true)
    expect(inlineTooltipIcon.props().content).toBe("help text")
  })

  it("does not render ol block", () => {
    const props = getHeadingProps({ body: "1) hello" })
    const wrapper = mount(<Heading {...props} />)
    expect(wrapper.find("h1").text()).toEqual("1) hello")
    expect(wrapper.find("ol")).toHaveLength(0)
  })

  it("does not render ul block", () => {
    const props = getHeadingProps({ body: "* hello" })
    const wrapper = mount(<Heading {...props} />)
    expect(wrapper.find("h1").text()).toEqual("* hello")
    expect(wrapper.find("ul")).toHaveLength(0)
  })

  it("does not render blockquote with >", () => {
    const props = getHeadingProps({ body: ">hello" })
    const wrapper = mount(<Heading {...props} />)
    expect(wrapper.find("h1").text()).toEqual(">hello")
    expect(wrapper.find("blockquote")).toHaveLength(0)
  })

  it("does not render tables", () => {
    const props = getHeadingProps({
      body: `| Syntax | Description |
        | ----------- | ----------- |
        | Header      | Title       |
        | Paragraph   | Text        |`,
    })
    const wrapper = mount(<Heading {...props} />)
    expect(wrapper.find("h1").text()).toEqual(`| Syntax | Description |`)
    expect(wrapper.find("RenderedMarkdown").at(1).text()).toEqual(
      `| ----------- | ----------- |
    | Header      | Title       |
    | Paragraph   | Text        |`
    )
    expect(wrapper.find("table")).toHaveLength(0)
  })
})

const getCustomCodeTagProps = (
  props: Partial<CustomCodeTagProps> = {}
): CustomCodeTagProps => ({
  children: [
    `import streamlit as st

st.write("Hello")
`,
  ],
  node: { type: "element", tagName: "tagName", children: [] },
  ...props,
})

describe("CustomCodeTag Element", () => {
  it("should render without crashing", () => {
    const props = getCustomCodeTagProps()
    const { baseElement } = render(<CustomCodeTag {...props} />)

    expect(baseElement.querySelectorAll("pre code")).toHaveLength(1)
  })

  it("should render as plaintext", () => {
    const props = getCustomCodeTagProps({ className: "language-plaintext" })
    const { baseElement } = render(<CustomCodeTag {...props} />)

    expect(baseElement.querySelector("pre code")?.outerHTML).toBe(
      '<code class="language-plaintext" style="white-space: pre;"><span>import streamlit as st\n' +
        "</span>\n" +
        'st.write("Hello")</code>'
    )
  })

  it("should render copy button when code block has content", () => {
    const props = getCustomCodeTagProps({
      children: ["i am not empty"],
    })
    const { baseElement } = render(<CustomCodeTag {...props} />)
    expect(
      baseElement.querySelectorAll('[title="Copy to clipboard"]')
    ).toHaveLength(1)
  })

  it("should not render copy button when code block is empty", () => {
    const props = getCustomCodeTagProps({
      children: [""],
    })
    const { baseElement } = render(<CustomCodeTag {...props} />)
    expect(
      baseElement.querySelectorAll('[title="Copy to clipboard"]')
    ).toHaveLength(0)
  })

  it("should render inline", () => {
    const props = getCustomCodeTagProps({ inline: true })
    const { baseElement } = render(<CustomCodeTag {...props} />)
    expect(baseElement.innerHTML).toBe(
      "<div><code>" +
        "import streamlit as st\n\n" +
        'st.write("Hello")\n' +
        "</code></div>"
    )
  })
})
