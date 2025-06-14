# Shortcode Examples

## Basic Shortcodes

### Self-closing shortcode
```
[su_divider top="yes" text="Section Break" /]
```

### Shortcode with content
```
[su_box title="Information" style="glass"]
This is the content inside the box.
[/su_box]
```

### Button shortcode
```
[su_button url="/about" target="_self" style="flat" background="#4FC3F7" size="5"]
Learn More
[/su_button]
```

## Nested Shortcodes

### Tabs example
```
[su_tabs]
[su_tab title="First Tab"]
Content for the first tab goes here.
[/su_tab]
[su_tab title="Second Tab"]
Content for the second tab.
[/su_tab]
[/su_tabs]
```

### Complex nesting
```
[su_box title="Nested Example" style="soft"]
Here's a box with nested content:

[su_highlight background="#ffff00"]Important text[/su_highlight]

[su_quote cite="Author Name"]
This is a quote inside the box.
[/su_quote]
[/su_box]
```

## Custom Shortcodes

### Genetic Algorithm Simulation
```
[genetic-algorithm mutation-level="5" with-badger="true" /]
```

### Dawkins Weasel Simulation
```
[dawkins-weasel /]
```

## Mixed Content

```
This is regular paragraph text.

[su_box title="Info Box" style="glass"]
Some information here.
[/su_box]

More regular text after the shortcode.

[su_button url="/contact"]Contact Us[/su_button]

Final paragraph of text.
```

## Attributes Examples

### Boolean attributes
```
[su_youtube url="https://youtube.com/watch?v=123" responsive="yes" autoplay /]
```

### Numeric attributes
```
[su_divider top="20" size="3" /]
```

### String attributes with spaces
```
[su_box title="My Custom Title" class="custom-class-name"]
Content here
[/su_box]
```