<h3 align="center">
    <a href="https://github.com/b4fun/ku">
        <img src="docs/assets/logo.svg" width="220px" height="100px" style="inline-block" />
    </a>
</h3>

<h5 align="center">
Toolkit for collecting and exploring logs using KQL and sqlite.
</h3>

**Ku** (/ko͞o/) collects logs from program output and persists in a sqlite database. It provides a web browser interface for exploring the logs using [KQL][kql].

<img src="docs/assets/screenshot 1.png" align="right" height="320px">

[kql]: https://docs.microsoft.com/en-us/azure/data-explorer/kusto/query/

**Why KQL?** KQL (Kusto Query Language) is a way to explore data with SQL like language. Different than typical SQL syntax, KQL uses ML like syntax, which provides better reading / writing experience. Learn more about [on Microsoft Docs][kql].

**Why sqlite?** Sqlite is a lightweight, self-contained RDBMS with rich features set. It can be used in local and in the cloud. Ku uses sqlite as data backend to archive data persistency and portability.

**Why Ku?** It's a common challenge that querying logs form cloud-native applications in both local and production. One straightforward way is to use tools like `grep` to perform quick searching - however, in most of the cases we need more powerful querying languages to explore the data. Ku aims to fulfill this scenario by brining KQL and sqlite together.

**Project Status** Ku is in a very early stage of development (bugs inside &#8482;). Any contribution is welcome. Please feel free to open an issue or pull request.

### Next: [Getting Started][getting_started] | [LICENSE](LICENSE)

[getting_started]: /docs/getting_started.md